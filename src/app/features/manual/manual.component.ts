import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { marked } from 'marked';

interface TocEntry {
    id: string;
    text: string;
    level: number;
}

// Página del manual dentro de la app (2026-08-07) — antes "☰ Menú → 📖 Manual de uso" abría
// /MANUAL-USUARIO.md como archivo estático crudo (markdown sin renderizar, feo en cualquier
// browser). Sigue habiendo un solo archivo fuente de verdad (MANUAL-USUARIO.md en public/, ver
// CLAUDE.md) — este componente solo lo fetchea y lo renderiza lindo, no duplica el contenido.
@Component({
    selector: 'app-manual',
    standalone: true,
    imports: [],
    templateUrl: './manual.component.html',
})
export class ManualComponent implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    // Referencia al <article> ya renderizado — necesaria porque los ids de cada heading se
    // asignan DESPUÉS de que Angular pinte el innerHTML (ver applyHeadingIds más abajo).
    @ViewChild('articleEl') private articleEl?: ElementRef<HTMLElement>;

    loading = signal(true);
    error = signal<string | null>(null);
    contentHtml = signal('');
    toc = signal<TocEntry[]>([]);

    ngOnInit(): void {
        this.http.get('/MANUAL-USUARIO.md', { responseType: 'text' }).subscribe({
            next: (markdown) => {
                const toc = this.buildToc(markdown);
                const html = marked.parse(markdown, { breaks: true, async: false }) as string;
                this.toc.set(toc);
                this.contentHtml.set(html);
                this.loading.set(false);
                // setTimeout(0), no directo: hace falta que Angular termine de pintar el
                // [innerHTML] nuevo en el DOM antes de poder buscar los <h2>/<h3> reales.
                setTimeout(() => this.applyHeadingIds(toc), 0);
            },
            error: () => {
                this.error.set('No se pudo cargar el manual.');
                this.loading.set(false);
            },
        });
    }

    // Bug real (2026-08-07): el sanitizador de Angular para [innerHTML] (el que corre siempre que
    // no se usa DomSanitizer.bypassSecurityTrustHtml — acá tampoco se usa, mismo criterio que el
    // chat del AI Advisor) elimina el atributo "id" del HTML, aunque deje "class"/"href" intactos.
    // Inyectar `id="..."` directo en el string de HTML (como se intentó primero) nunca llegaba al
    // DOM real por esto. Fix: asignar los ids DESPUÉS, directo sobre los nodos ya renderizados —
    // asignar .id nativo no pasa por el sanitizador, mismo mecanismo que ya usa scrollToSection()
    // con getElementById.
    private applyHeadingIds(toc: TocEntry[]): void {
        const headings = this.articleEl?.nativeElement.querySelectorAll('h2, h3');
        headings?.forEach((el, i) => {
            const entry = toc[i];
            if (entry) el.id = entry.id;
        });
    }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }

    // Bug real (2026-08-07): un <a href="#id"> nativo, en una app Angular con <base href="/">
    // (obligatorio para el ruteo con pushState), resuelve el fragmento contra la base — navega a
    // "/#id" en vez de "/manual#id". "/#id" no matchea ninguna ruta real y cae en el wildcard, que
    // redirige a login — clickear el índice del manual "te desloguea" en apariencia. Fix: scroll
    // manual, sin dejar que el navegador resuelva el href nativo.
    scrollToSection(id: string, event: Event): void {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Extrae los títulos ## y ### del markdown crudo, en orden — la misma fuente que usa marked
    // para renderizar, así que el orden coincide 1 a 1 con los <h2>/<h3> del HTML resultante.
    private buildToc(markdown: string): TocEntry[] {
        const entries: TocEntry[] = [];
        const headingRegex = /^(#{2,3})\s+(.+)$/gm;
        let match: RegExpExecArray | null;
        while ((match = headingRegex.exec(markdown)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            entries.push({ id: this.slugify(text), text, level });
        }
        return entries;
    }

    private slugify(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '') // saca acentos (NFD separa á en "a" + marca combinante, esto saca la marca)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
