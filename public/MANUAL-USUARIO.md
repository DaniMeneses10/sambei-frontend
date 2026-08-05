# Sambei — Manual de usuario

Esta es la guía completa, paso a paso, de qué hace Sambei y cómo se usa — sin tecnicismos de
programación. Cada sección describe lo que la app **realmente hace hoy**, verificado contra el
código, no lo que está planeado. La última sección ("Cosas que Sambei todavía NO hace") está
sincronizada con la cola de tareas real del proyecto (`CLAUDE.md`) — si algo no aparece descrito acá
como funcionando, es porque todavía no existe.

> **Este es el único manual que existe** — dentro de la app, el menú "☰ Menú" → "📖 Manual de uso"
> abre este mismo archivo en una pestaña nueva. No hay una versión resumida aparte: mantener un solo
> archivo evita que las dos versiones diverjan con el tiempo.

---

## 0. ¿Qué es Sambei?

Una app para llevar tus inversiones en ETFs, acciones y crypto en un solo lugar, y para ayudarte a
pensar dónde invertir con datos reales — no con intuición ni con lo que "se dice por ahí". Todo lo
que Sambei sabe sale de fuentes reales y verificables:

| Qué sabe Sambei | De dónde sale |
|---|---|
| Precios de crypto en tiempo real | Binance |
| Precios e historial de ETFs y acciones | Yahoo Finance |
| Noticias financieras + sentimiento | Marketaux |
| Trades reales de congresistas de EE.UU. | Cámara de Representantes (`disclosures-clerk.house.gov`, fuente oficial, STOCK Act) |
| Proyección estadística de tendencia | Un modelo propio (ML.NET), entrenado con el historial real de cada símbolo |

Nada se inventa. Si un dato no está disponible (por ejemplo, sentimiento de noticias para crypto, o
proyección de tendencia para un símbolo con poca historia), la app lo omite en vez de rellenarlo con
algo inventado.

**Filosofía de inversión:** Sambei está pensada para inversores pasivos de largo plazo (estrategia
DCA — Dollar Cost Averaging: comprar de a poco, con constancia, en vez de intentar acertarle al
momento exacto de entrar o salir del mercado). Esto no es solo un consejo de marketing — está
metido como regla dura en el AI Advisor (sección 9): nunca te va a decir "comprá ahora" ni "vendé
ahora".

---

## 1. Crear tu cuenta y entrar

### 1.1 Cómo acceder

- **URL pública (recomendado si solo querés usarla, sin instalar nada):**
  `https://sambei-app.orangebush-8b6e511c.westus2.azurecontainerapps.io/` — corre en Azure. Puede
  tardar unos segundos extra en responder al primer request si nadie la usó en un rato (la
  infraestructura escala a cero para ahorrar costo cuando está inactiva — esto es normal, no es un
  error).
- **Local:** `http://localhost:5070`, con la app corriendo en tu máquina (ver `README.md` para cómo
  levantarla).

Las cuentas de Azure y las de local son bases de datos **completamente separadas** — una cuenta
creada en una no existe en la otra.

### 1.2 Registrarte (primera vez)

Botón **"Registrarse"** desde la pantalla de login. Pide:

| Campo | Regla |
|---|---|
| Nombre | Mínimo 2 caracteres |
| Apellido | Mínimo 2 caracteres |
| Email | Formato de email válido |
| Contraseña | Mínimo 4 caracteres |
| Confirmar contraseña | Tiene que coincidir exactamente con la contraseña |

Al enviar el formulario, si todo es válido, la app te loguea automáticamente y te lleva directo al
Dashboard — no hace falta un paso extra de "confirmá tu email" (no existe verificación por email en
Sambei hoy).

### 1.3 Iniciar sesión

Botón **"Iniciar sesión"** con tu email y contraseña (mínimo 4 caracteres, mismo criterio que el
registro). Si las credenciales son incorrectas, te avisa sin decir si el problema fue el email o la
contraseña (por seguridad, no se revela cuál de los dos falló).

**Cuánto dura tu sesión:** una vez logueado, tu sesión (técnicamente, un token JWT) dura **24
horas**. Pasado ese tiempo, la próxima vez que abras la app te va a pedir loguearte de nuevo — es
automático, no hay nada que configurar. Mientras la sesión esté activa, no hace falta volver a
loguearte cada vez que abrís la app, aunque cierres la pestaña o el navegador.

### 1.4 ¿Olvidaste tu contraseña?

1. En la pantalla de login, click en "¿Olvidaste tu contraseña?".
2. Escribí tu email y enviá. La app **siempre** te va a mostrar el mismo mensaje de éxito, exista o
   no esa cuenta — es una medida de seguridad a propósito (evita que alguien use ese formulario para
   "adivinar" qué emails están registrados en la app).
3. Si el email existe, se genera un link de recuperación real. **Hoy ese link no se manda por correo
   todavía** (el servicio de envío de emails — Resend — está integrado en el código pero sin una
   clave real configurada) — en su lugar, el link queda escrito en la consola/logs donde corre el
   servidor. Si vos mismo administrás el servidor (uso local), buscalo ahí. Si estás usando la app
   pública sin acceso al servidor, este flujo hoy no te sirve para recuperar el acceso — contactá a
   quien administra la app.
4. Con el link (email + token), entrás a una pantalla para poner tu contraseña nueva dos veces
   (mínimo 4 caracteres, tienen que coincidir).
5. **Cada link de recuperación sirve una sola vez** — si lo volvés a usar después de haber cambiado
   la contraseña, va a fallar (comportamiento esperado, no un bug: cambiar la contraseña invalida el
   token viejo).

### 1.5 Privacidad de tu cuenta

Tu cuenta es privada: **tus inversiones y tus conversaciones con el AI Advisor solo las ves vos.**
Otra persona que se registre en la misma app arranca con su propio portfolio vacío, sin ver el tuyo,
y no puede editar ni borrar tus inversiones aunque conozca su identificador interno.

Lo que **no** es privado ni tuyo — es información global, compartida entre todos los usuarios de la
app (porque son hechos del mundo real, no algo que vos generás): el historial de precios, las
noticias, los trades reales de congresistas, y el puntaje de cada congresista. Un usuario nuevo, al
registrarse, ya encuentra todo esto cargado — no tiene que generarlo él.

---

## 2. Tu perfil de riesgo

La primera vez que entrás al Dashboard, te va a aparecer un modal para elegir tu perfil como
inversor. **No se puede cerrar sin elegir uno** — es intencional: el AI Advisor lo necesita para
darte respuestas concretas en vez de preguntarte lo mismo en cada conversación nueva.

Tres opciones, cada una con una descripción y un ejemplo concreto (no una pregunta abierta tipo
"¿cuál es tu tolerancia al riesgo?" — la app te muestra directamente qué significa cada una):

| Perfil | Qué significa | Ejemplo concreto |
|---|---|---|
| **Conservador** | Preferís estabilidad antes que rendimiento | Mayormente ETFs diversificados como VOO/QQQ, poco o nada en acciones individuales o crypto |
| **Básico** | Un balance entre crecimiento y estabilidad | ETFs como base, con una porción menor en acciones individuales o Bitcoin |
| **Arriesgado** | Buscás mayor crecimiento y tolerás más volatilidad | Más peso en acciones individuales y crypto, aunque sea menos diversificado |

Una vez elegido, podés cambiarlo cuando quieras con el botón **"⚙ Perfil: {tu perfil actual}"**
arriba del Dashboard — ahí sí aparece la opción de cancelar sin cambiar nada.

**Qué hace la app con esto:** cada vez que le preguntás algo al AI Advisor, tu perfil se le agrega
al contexto automáticamente. El Advisor tiene la instrucción explícita de **nunca volver a
preguntarte tu perfil de riesgo, horizonte o tolerancia una vez que ya lo declaraste** — solo lo
vuelve a preguntar si por algún motivo no tenés ninguno guardado.

---

## 3. Cargar tu primera inversión

En el Dashboard, botón **"+ Nueva posición"**. Formulario con estos campos:

| Campo | Qué poner | Detalle |
|---|---|---|
| **Nombre** | — | Es de solo lectura. Se completa **solo**, apenas escribís el Symbol (con un pequeño delay mientras tipeás) — no se puede editar a mano, para evitar errores de tipeo. Para crypto usa directamente el ticker (Binance no da un nombre descriptivo). |
| **Symbol** | El ticker que vos reconocés (ej. `VOO`, `BTC`, `NVDA`, `EIMI`) | Se guarda siempre en mayúsculas, sin importar cómo lo tipees. |
| **Provider Symbol** (opcional) | Solo si el ticker que ves en tu bróker **no** es el que reconocen los mercados internacionalmente | Ver ejemplos abajo. Si lo dejás vacío, la app usa el Symbol tal cual. |
| **Tipo de asset** | Crypto / ETF / Acción | Define qué proveedor de precios usa la app por detrás (Binance para crypto, Yahoo Finance para ETF y Acción). |
| **Broker** | El bróker donde lo compraste (texto libre — ej. `XTB`, `HAPI`, `Manual`) | Se guarda en mayúsculas. No hay una lista cerrada de brokers, podés escribir cualquier nombre. |
| **Cantidad** | Cuántas unidades compraste | Acepta decimales (ej. `0.0234` BTC). |
| **Precio de compra** | A cuánto pagaste por unidad | Acepta decimales. |
| **Fecha de compra** | Cuándo lo compraste | Selector de fecha. |

### 3.1 Cuándo usar "Provider Symbol"

Este campo existe porque el ticker que **vos** reconocés (el que te muestra tu bróker) a veces no es
el que usa Yahoo Finance para buscar el precio. Dos casos reales:

- **ETFs europeos:** cotizan en una bolsa distinta a la americana y necesitan el sufijo de esa
  bolsa. Ejemplo: Symbol = `EIMI`, Provider Symbol = `EIMI.L` (Londres). Otros sufijos: `.DE`
  (Xetra/Alemania), `.AS` (Euronext Ámsterdam).
- **Acciones con "clases" o tickers no estándar:** ejemplo real, Berkshire Hathaway Clase B — tu
  bróker puede mostrarlo como `BRKpB`, pero el ticker real que reconoce Yahoo Finance es `BRK-B`.
  Ahí ponés Symbol = `BRKpB` (lo que vos reconocés, lo que se muestra en toda la app) y Provider
  Symbol = `BRK-B` (lo que se usa por detrás para buscar el precio real).

Si tu activo no tiene este problema (la gran mayoría de acciones y ETFs americanos, y todo lo que es
crypto), dejalo vacío.

### 3.2 Qué pasa apenas guardás

La app trae **sola** el precio actual y hasta 1000 días de historial de precios (según cuánta
historia real exista para ese símbolo) — no hace falta cargar nada más a mano. Esto pasa la primera
vez que ves ese símbolo en tu Dashboard o en la página de detalle; después, la app se encarga de
mantener ese historial al día automáticamente cada vez que lo consultás (sin que tengas que hacer
nada).

---

## 4. ¿Compraste el mismo activo varias veces? (DCA)

No hace falta volver a llenar todo el formulario cada vez. Desde la página de detalle de ese activo
(`/portfolio/SÍMBOLO`, ver sección 6) hay un botón **"+ Agregar compra"** que ya sabe el nombre,
símbolo, tipo de activo y provider symbol (son siempre el mismo activo) — solo te pide:

- Cantidad
- Precio de compra
- Fecha de compra
- Broker

La app junta automáticamente todas tus compras de un mismo símbolo y calcula:

- **Cantidad total** = suma de todas las compras.
- **Precio de compra promedio ponderado** = mismo criterio que usa cualquier bróker real (no es un
  promedio simple entre los precios — pesa más la compra más grande).

En el Dashboard vas a ver **una sola fila** por símbolo con esos totales. En la página de detalle de
ese activo vas a ver, además, **cada compra por separado** (sección 6).

---

## 5. Leer el Dashboard

Es la pantalla principal, con todas tus posiciones juntas.

### 5.1 Orden y resumen

- La lista de posiciones está **ordenada de mayor a menor rentabilidad** — de un vistazo ves qué te
  está rindiendo mejor.
- Arriba, un resumen con el total invertido, el valor actual de todo tu portfolio, y la
  ganancia/pérdida total en dólares y en porcentaje.

### 5.2 El gráfico

- Muestra **rendimiento en %** desde tu precio de compra promedio, **no** el precio en dólares — así
  se pueden comparar en la misma escala activos de precios muy distintos (por ejemplo, Bitcoin a
  $60.000 y un ETF a $50).
- **Línea en 0%** = tu precio de compra promedio. Arriba de esa línea vas ganando, abajo vas
  perdiendo.
- Podés togglear qué activos se ven en el gráfico haciendo click en cada uno (los círculos de
  colores de la leyenda). Cada símbolo tiene un color fijo consistente entre recargas — si tenés
  varios activos, la app reparte una paleta de colores sin repetir entre ellos.
- **Acá no se ven marcas de "cuándo compré"** — esas viven solo dentro de la página de detalle de
  cada activo (sección 6), a propósito: con varios activos en el mismo gráfico, mostrar todas las
  fechas de compra lo saturaría demasiado para ser legible.

### 5.3 Trades del Congreso en el gráfico (estrellas ★)

- Marcan cuándo un congresista de EE.UU. **compró** (★ verde) o **vendió** (★ roja) alguno de tus
  activos, en los últimos 365 días.
- Pasá el mouse por encima de una estrella para ver un tooltip flotante con el nombre completo del
  congresista, la fecha exacta, la acción (compra/venta) y el rango de monto declarado.
- **Filtro "⭐ Filtrar congresistas":** arranca **sin nadie marcado a propósito** — si mostrara a
  todos de entrada, con muchas compras cercanas en el tiempo el gráfico se satura de estrellas
  superpuestas y no se puede distinguir nada. Desde este dropdown podés:
  - Buscar un congresista puntual por nombre (barra de búsqueda arriba de la lista).
  - Tildar/destildar quiénes se muestran, uno por uno.
  - "Seleccionar todos" / "Desmarcar todos" para prender o apagar todas las estrellas de una.

### 5.4 Noticias

Debajo del gráfico, las últimas noticias relacionadas con tus activos (todas mezcladas, sin filtrar
por símbolo — para eso está la vista de detalle, sección 6). Cada noticia muestra:

- Título, resumen y fecha (relativa, ej. "hace 3 horas").
- Un indicador de sentimiento cuando existe: **▲ verde** (positivo), **▼ roja** (negativo), o **●
  gris** (neutral), junto con el número exacto del score.
- **Crypto no tiene sentimiento** (la fuente de noticias, Marketaux, en su plan gratuito solo cubre
  activos de bolsa) — para BTC/ETH/etc. vas a ver noticias sin ese indicador, o directamente menos
  noticias.

### 5.5 Estados de carga y error

- Mientras carga el Dashboard la primera vez, ves un spinner animado.
- Si algo falla al cargar (por ejemplo, una API externa no responde), ves un mensaje de error claro
  con un botón para reintentar — no una pantalla en blanco.

### 5.6 Menú superior

- **"☰ Menú"** (dropdown): "📖 Manual de uso" (abre este mismo documento en una pestaña nueva) y
  "Salir" (cierra tu sesión).
- **"⚙ Perfil: {tu perfil}"**: cambiar tu perfil de riesgo (sección 2).
- El logo "Sambei" es un link al Dashboard desde cualquier pantalla.

---

## 6. Ver el detalle de un activo

Click en cualquier fila de una posición (en el Dashboard) → te lleva a su página propia
(`/portfolio/SÍMBOLO`). Esta vista tiene información que el Dashboard, a propósito, no muestra para
no saturarse con varios activos a la vez:

### 6.1 El gráfico de este activo

- Mismo tipo de gráfico (% de rendimiento desde tu precio de compra), pero solo de este activo.
- **Selector de período:** 1 mes / 3 meses / 6 meses / 1 año / **Todo**. A diferencia del Dashboard
  (que arranca en "1 año"), acá el período por default es **"Todo"** — porque acá sí importa ver
  cada compra marcada en el gráfico completo, no solo el rendimiento reciente.
- **Marcas ▲ de cada compra**, siempre en **azul fijo** (no el color asignado al activo — para no
  confundirse con la línea del gráfico). Cada una está ubicada en su fecha real, sobre el historial
  completo (no recorta el gráfico a partir de la fecha de compra).

### 6.2 Trades del Congreso de este activo

Mismo mecanismo que el Dashboard (estrellas ★ verdes/rojas con tooltip al hover, mismo filtro por
congresista con buscador), pero acá se muestra el **histórico completo**, no solo los últimos 365
días — porque esta vista ya está enfocada en un solo activo, tiene sentido ver todo lo que hay.

### 6.3 Tabla de compras (una fila por lote)

A diferencia del Dashboard (que agrupa todo en una fila con el promedio), acá ves **cada compra por
separado**, ordenadas de la más reciente a la más vieja:

| Columna | Qué muestra |
|---|---|
| Fecha | Fecha de esa compra puntual |
| Broker | Bróker de esa compra puntual |
| Precio | Precio pagado en esa compra |
| Cantidad | Cantidad de esa compra |
| Ganancia/Pérdida | Calculada con el precio actual del activo |

En mobile, esto se ve como una lista de tarjetas; en desktop, como una tabla.

### 6.4 Editar una compra puntual

Botón **"✎ Editar"** en cada fila. Podés corregir:

- Cantidad
- Precio de compra
- Fecha de compra
- Broker

**Lo que NO se puede editar:** el símbolo, el tipo de activo, el nombre ni el provider symbol — eso
define **qué** compraste, no **cómo** fue esa compra puntual. Si eso está mal cargado, la solución es
borrar esa inversión y volver a cargarla bien (sección 8).

Solo podés editar compras que sean tuyas — si por algún motivo intentaras editar una que no es tuya
(no hay forma de hacerlo desde la interfaz normal, pero el backend lo verifica igual), la app lo
rechaza.

### 6.5 Noticias de este activo

Mismo tipo de tarjetas de noticias que el Dashboard, pero filtradas solo a este símbolo.

### 6.6 AI Advisor de este activo

Un chat dedicado a este activo puntual — ver sección 9.

---

## 7. Eliminar una inversión

Desde el Dashboard, click en la fila de una posición → aparece un modal de confirmación → confirmás
→ se borra. **Esto borra todos los lotes de compra de ese símbolo juntos** (no uno por uno) y es
**definitivo** — no hay forma de deshacerlo desde la app. Si te arrepentís, hay que volver a cargar
la inversión desde cero.

---

## 8. Trades del Congreso — de dónde salen y qué son las estrellas

### 8.1 La fuente

Todos los trades que ves en Sambei son **reales**, declarados oficialmente por congresistas de
EE.UU. bajo el **STOCK Act** (una ley que los obliga a declarar sus operaciones bursátiles),
descargados directo de `disclosures-clerk.house.gov` — el sitio oficial de la Cámara de
Representantes.

**Importante — solo Cámara de Representantes, no Senado.** El Senado usa otro sistema
(`efdsearch.senate.gov`), con otro formato, que Sambei todavía no lee. Si buscás a un senador
puntual y no aparece, no es un error — es una fuente que no está integrada todavía.

**Los montos son rangos, no cifras exactas** (ej. "$500k-$1M") — así es exactamente como el STOCK
Act obliga a declarar. No es una limitación de Sambei ni un dato incompleto; es el formato real de
la ley.

### 8.2 Cómo se calcula el puntaje de cada congresista (1 a 5 estrellas)

Este es un cálculo real, no una opinión ni un ranking externo copiado de otro lado. Así funciona:

1. Sambei mira **todas las compras** ("Buy") de todos los congresistas que ya tengan **al menos 3
   meses de antigüedad** — una compra de la semana pasada todavía no se puede evaluar, porque no
   pasó tiempo suficiente para saber si "salió bien".
2. Para cada compra evaluable, busca el precio del activo el día de la compra y el precio 3 meses
   después (con una tolerancia de ±7 días, por si esas fechas caen en fin de semana o feriado de
   mercado), y calcula el retorno % en ese período.
3. Promedia todos los retornos de cada congresista (todas sus compras evaluables).
4. **Ordena a todos los congresistas** de mejor a peor promedio, y los reparte en 5 grupos iguales
   (quintiles) — el 20% con mejor resultado promedio recibe 5★, el siguiente 20% recibe 4★, y así
   sucesivamente hasta 1★. **No es un umbral fijo de rentabilidad** (por ejemplo, "más de 10% =
   5★") — es un ranking relativo entre todos los congresistas evaluados en ese momento.

Este recálculo se dispara manualmente (no corre solo en un horario fijo todavía) — si pasó mucho
tiempo desde la última vez, los puntajes que ves pueden no incluir las compras más recientes.

---

## 9. El AI Advisor — el chat

Hay **dos chats independientes**, con historiales separados:

- **En el Dashboard:** para preguntas generales de tu portfolio completo (ej. "¿cómo viene mi
  cartera?", "¿en qué más debería invertir?").
- **En la página de un activo (`/portfolio/SÍMBOLO`):** para preguntas puntuales de ESE activo, sin
  tener que aclarar de cuál hablás — ya sabe en qué página estás.

### 9.1 Qué mira el Advisor para responder

Depende de qué le preguntes:

**Si preguntás por un activo puntual** (mencionás el símbolo en el chat general, o estás en su
página de detalle):
- Tu posición real en ese activo (ganancia/pérdida desde que compraste).
- Las últimas 3 noticias de ese activo.
- Los últimos 5 trades de congresistas sobre ese activo.
- La proyección de tendencia de corto plazo, si el símbolo tiene suficiente historia para calcularla
  (ver sección 9.2).
- El crecimiento histórico real de largo plazo (1/3/5 años), si hay suficiente historia (sección 9.2).

**Si hacés una pregunta general** ("en qué invierto", "qué me conviene", sin mencionar un símbolo):
- Tu portfolio completo, si tenés inversiones cargadas.
- **Siempre, además**, una lista de oportunidades — activos comprados recientemente por congresistas
  con buen puntaje (4-5★), pre-filtrados por actividad reciente y **ordenados por crecimiento
  histórico real**, no por qué tan reciente fue la compra del congresista. Esto pasa **siempre** que
  la pregunta es general, tengas o no tengas inversiones cargadas — no hace falta que aclares "dame
  las más rentables", el sistema ya prioriza así por defecto.

**En cualquiera de los dos casos:** tu perfil de riesgo (sección 2) se usa para adaptar la respuesta,
y el Advisor **nunca te lo vuelve a preguntar** una vez que ya lo elegiste.

### 9.2 Las dos formas de hablar de "crecimiento" — y por qué son distintas

Sambei usa dos herramientas distintas para dos preguntas distintas — mezclar ambas sería engañoso, y
el Advisor tiene instrucciones explícitas de no hacerlo:

| Herramienta | Para qué sirve | Cómo se calcula | Límites |
|---|---|---|---|
| **Proyección de tendencia** (corto plazo, 60-90 días) | Estimar hacia dónde puede ir el precio en las próximas semanas | Modelo estadístico propio (ML.NET, técnica SSA), entrenado con el historial real de precios de cada símbolo, validado con la técnica de "walk-forward" (probado contra datos que el modelo no vio) | Siempre viene con su **margen de error (MAPE)** — cuanto más alto, menos confiable esa proyección puntual. Necesita al menos ~1000 días de historia para calcularse; símbolos nuevos o con poca historia no la tienen todavía. Solo válido para este rango corto — no se usa para hablar de años, porque el error crece mucho a más distancia. |
| **Crecimiento histórico real** (largo plazo, 1/3/5 años) | Pensar en años, no en semanas | **No es una proyección** — es lo que realmente pasó con el precio, calculado directo sobre el historial guardado (retorno total %, promedio anual/CAGR, y un ejemplo en dólares: "$1000 invertidos hace 3 años valdrían hoy ~$X") | Depende de cuánta historia real haya — si el símbolo tiene menos de 1 año de historia, no vas a ver el dato de 3 o 5 años. Es un patrón pasado, no una garantía de que se repita. |

El Advisor siempre te aclara cuál de las dos está usando cuando te responde, y remarca que ninguna
de las dos es una garantía — son señales con evidencia real detrás, no promesas.

### 9.3 Lo que el Advisor NO hace (reglas duras, no sugerencias)

- **Nunca te dice "comprá ahora" ni "vendé ahora"** en el sentido de timing de mercado — su rol es
  analizar y explicar con datos, la decisión final siempre es tuya. Esto está en su configuración
  base, no es que "se le puede escapar" según la pregunta.
- **No ejecuta ninguna operación** — es un chat de análisis, no un bróker. No puede comprar, vender,
  ni mover dinero.
- Responde siempre en español, de forma concisa.

### 9.4 Tus conversaciones no se guardan para siempre

**Las conversaciones con el AI Advisor se borran automáticamente después de 3 días** — es una
decisión a propósito, porque el contexto que usa el Advisor (precios, noticias, proyecciones) cambia
día a día, y una respuesta vieja pierde sentido rápido. No hay forma de recuperar una conversación
después de esa ventana. Esto aplica tanto al chat general como a los chats por activo.

---

## 10. Cosas que Sambei todavía NO hace

Para que no las busques de más — están planeadas (algunas ya diseñadas en detalle) pero no
construidas todavía. Esta lista está sincronizada con la cola de trabajo real del proyecto:

- **No podés depositar dinero real ni ejecutar órdenes de compra/venta desde la app** — hoy es
  seguimiento manual de lo que ya compraste en otro lado, no un bróker. (Feature "Wallet" y
  "Trading", diseñadas, sin construir.)
- **No hay forma de registrar una venta** — la app asume que todo lo que cargaste sigue en tu poder.
  Si vendiste algo, hoy la única opción es borrar la inversión completa. Tampoco hay forma de
  eliminar un solo lote de compra puntual (sí podés editarlo) — solo se puede borrar el símbolo
  entero desde el Dashboard.
- **No distingue "lo que tengo" de "lo que estoy vigilando sin comprar"** — todo lo que cargás cuenta
  como comprado y entra en el cálculo de P&L total. (Feature "Portfolio vs Watchlist", diseñada, sin
  construir.)
- **Los trades de congresistas son solo de la Cámara de Representantes**, no del Senado (ver sección
  8.1).
- **No hay datos de inversores institucionales** (Buffett/Berkshire, Dalio/Bridgewater, Cathie
  Wood/ARK vía SEC EDGAR) todavía — está diseñado pero no implementado. Esto también bloquea el
  "Radar de Oportunidades" (alertas proactivas de qué comprar), que depende de esta pieza.
  Mientras tanto, la sección de oportunidades del AI Advisor (9.1) usa solo la señal de
  congresistas — es una primera versión real de esa idea, ya funcionando, no la versión completa.
- **No podés cargar tu propia clave de API de Claude** todavía — el AI Advisor usa una clave
  compartida entre todos los usuarios. Para un uso con muchos usuarios reales esto está pendiente de
  resolver (diseño ya decidido: cada usuario va a poder configurar la suya, y sin una clave propia
  el Advisor quedaría deshabilitado con un mensaje claro en vez de usar la clave de otro por
  defecto).
- **El envío de emails reales todavía no está activo** — el link de recuperación de contraseña se
  genera de verdad, pero hoy solo queda logueado en el servidor en vez de llegarte por correo (ver
  sección 1.4).
- **No hay notificaciones ni alertas de precio** ("avisame si BTC baja de $80k") — diseñado a
  futuro, sin construir.
- **La visión completa de "motor de decisiones"** (analizar automáticamente miles de activos,
  backtesting de hasta 20 años de historia, un score único de 0 a 100 por activo, actualizado cada
  noche) **está diseñada en detalle pero no construida** — ver `SAMBEI-DECISION-ENGINE-DESIGN.md`
  para el plan completo. Lo que sí existe hoy (oportunidades por congresistas + crecimiento
  histórico + proyección de tendencia, sección 9.1) es la primera versión real y funcionando de esa
  misma idea, a mucha menor escala.
- **No hay una evaluación automática de si las señales que citó el Advisor "acertaron" con el
  tiempo** — diseñado (captura de qué vio el Advisor en cada respuesta), sin implementar.

---

## 11. Notas sueltas que conviene saber

- **ETFs europeos (EIMI, VWCE, CNDX...) muestran su último día con un día de retraso** en el
  gráfico, comparado con activos americanos — es porque esas bolsas (Londres, Xetra) publican su
  cierre un día después que el mercado americano. No es un bug, es el comportamiento real de esas
  bolsas.
- Los precios se cachean por 15 minutos por símbolo — si recargás la página varias veces seguidas en
  ese lapso, vas a ver el mismo precio (evita golpear de más a las APIs externas gratuitas, que
  tienen límites de uso).
- El historial de precios que guarda Sambei **nunca se borra ni se recorta** con el tiempo (a
  diferencia de las noticias, que sí se podan después de 30 días) — cuanta más historia acumulada,
  mejor funciona el modelo de tendencia.
