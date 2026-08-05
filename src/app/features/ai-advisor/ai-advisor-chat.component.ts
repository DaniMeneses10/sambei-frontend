import { Component, effect, ElementRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdvisorMessage } from '../../core/models/advisor.models';
import { AiAdvisorService } from '../../core/services/ai-advisor.service';

@Component({
    selector: 'app-ai-advisor-chat',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './ai-advisor-chat.component.html',
})
export class AiAdvisorChatComponent implements OnInit {
    private readonly advisorSvc = inject(AiAdvisorService);

    // Sin symbol: chat general del dashboard (como siempre). Con symbol: hilo propio de ese ETF,
    // con contexto RAG acotado a esa posición — no hace falta mencionar el símbolo al preguntar.
    @Input() symbol?: string;

    @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

    messages = signal<AdvisorMessage[]>([]);
    question = signal('');
    sending = signal(false);
    error = signal<string | null>(null);

    // Cuántos mensajes había la última vez que hicimos scroll — para distinguir "apareció un
    // mensaje nuevo" (sí hay que scrollear) de "el último mensaje creció un chunk más" (no hay
    // que scrollear). Sin esto, cada chunk del streaming arrastraba la vista hacia abajo, así
    // que al terminar una respuesta larga quedabas viendo el final, no el principio — pedido de
    // Daniel: que quede fijo en el punto donde arrancó a responder, se lee de arriba hacia abajo.
    private lastMessageCount = 0;

    constructor() {
        effect(() => {
            const msgs = this.messages();
            if (msgs.length !== this.lastMessageCount) {
                this.lastMessageCount = msgs.length;
                queueMicrotask(() => this.scrollToBottom());
            }
        });
    }

    private scrollToBottom(): void {
        const el = this.messagesContainer?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }

    async ngOnInit() {
        try {
            this.messages.set(await this.advisorSvc.getHistory(this.symbol));
        } catch {
            this.error.set('No se pudo cargar el historial del Advisor.');
        }
    }

    async send() {
        const question = this.question().trim();
        if (!question || this.sending()) return;

        this.error.set(null);
        this.question.set('');
        this.messages.update(msgs => [...msgs, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
        this.sending.set(true);

        try {
            await this.advisorSvc.sendMessage(question, chunk => {
                this.messages.update(msgs => {
                    const copy = [...msgs];
                    const last = copy[copy.length - 1];
                    copy[copy.length - 1] = { ...last, content: last.content + chunk };
                    return copy;
                });
            }, undefined, this.symbol);
        } catch {
            this.error.set('El AI Advisor no está disponible en este momento.');
        } finally {
            this.sending.set(false);
        }
    }
}
