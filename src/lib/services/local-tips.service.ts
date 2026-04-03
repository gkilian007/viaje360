/**
 * Local Tips Service
 *
 * Generates contextual tips about a destination:
 * - Cultural dos and don'ts
 * - Money-saving tricks
 * - Safety tips
 * - Local etiquette
 * - Transport hacks
 * - Food recommendations by time of day
 */

export interface LocalTip {
  id: string
  emoji: string
  title: string
  body: string
  category: "etiquette" | "money" | "safety" | "transport" | "food" | "practical"
  /** When is this tip most relevant? */
  timing?: "morning" | "afternoon" | "evening" | "anytime"
}

// ─── Tip database by city/country ─────────────────────────────────────────────

const TIPS_DB: Record<string, LocalTip[]> = {
  rome: [
    { id: "rome-water", emoji: "💧", title: "Agua gratis en toda Roma", body: "Los 'nasoni' (fuentes públicas) tienen agua potable excelente. No compres botellas — lleva una reutilizable.", category: "money", timing: "anytime" },
    { id: "rome-cover", emoji: "👗", title: "Código de vestimenta", body: "Vaticano, basílicas y muchas iglesias exigen hombros y rodillas cubiertas. Lleva un pañuelo grande por si acaso.", category: "etiquette", timing: "morning" },
    { id: "rome-coffee", emoji: "☕", title: "El café se toma en barra", body: "Sentarte en la terraza cuesta 2-3x más. Los locales piden un espresso en la barra por €1. Di 'un caffè, per favore'.", category: "money", timing: "morning" },
    { id: "rome-metro", emoji: "🚇", title: "Metro: solo 3 líneas", body: "El metro es limitado pero los autobuses cubren todo. App 'Muoversi a Roma' es la mejor para rutas.", category: "transport", timing: "anytime" },
    { id: "rome-lunch", emoji: "🍝", title: "Menu del giorno = chollo", body: "A mediodía busca 'menu del giorno' o 'pranzo' — primer + segundo + bebida por €10-15.", category: "food", timing: "afternoon" },
    { id: "rome-pickpocket", emoji: "⚠️", title: "Ojo con los carteristas", body: "Metro línea B (Coliseo-Termini) y Fontana di Trevi son zonas calientes. Lleva la cartera delante.", category: "safety", timing: "anytime" },
    { id: "rome-aperitivo", emoji: "🍸", title: "Aperitivo = cena gratis", body: "Muchos bares ofrecen buffet libre con la bebida (€8-12) entre 18:00-21:00. Trastevere y San Lorenzo son los mejores.", category: "food", timing: "evening" },
    { id: "rome-skip-line", emoji: "🎟️", title: "Reserva SIEMPRE online", body: "Vaticano, Coliseo, Galería Borghese... sin reserva = 2-3h de cola o entrada imposible.", category: "practical", timing: "anytime" },
  ],
  paris: [
    { id: "paris-bonjour", emoji: "🇫🇷", title: "Siempre di 'Bonjour'", body: "Al entrar en CUALQUIER tienda o restaurante. No hacerlo se considera maleducado.", category: "etiquette", timing: "anytime" },
    { id: "paris-navigo", emoji: "🚇", title: "Pase Navigo semanal", body: "€30 para metro+bus+RER ilimitados (lun-dom). Mucho mejor que billetes sueltos si estás 3+ días.", category: "transport", timing: "morning" },
    { id: "paris-tip", emoji: "💰", title: "La propina está incluida", body: "En Francia el 'service compris' ya va en la cuenta. Dejar 1-2€ extra es amable pero no obligatorio.", category: "money", timing: "anytime" },
    { id: "paris-boulangerie", emoji: "🥐", title: "Desayuna en boulangerie", body: "Croissant + café por €3-4. Los hoteles cobran €15-20 por el mismo desayuno.", category: "food", timing: "morning" },
    { id: "paris-museum", emoji: "🏛️", title: "Primer domingo = museos gratis", body: "Muchos museos nacionales son gratuitos el primer domingo de cada mes.", category: "money", timing: "anytime" },
    { id: "paris-water", emoji: "💧", title: "Agua gratis: 'une carafe d'eau'", body: "En cualquier restaurante puedes pedir una jarra de agua del grifo gratis. Es tu derecho legal.", category: "money", timing: "anytime" },
  ],
  tokyo: [
    { id: "tokyo-suica", emoji: "🚃", title: "Compra Suica/Pasmo al llegar", body: "Tarjeta recargable para todo el transporte + konbini. Ahorras tiempo y dinero vs billetes sueltos.", category: "transport", timing: "morning" },
    { id: "tokyo-cash", emoji: "💴", title: "Japón es país de efectivo", body: "Muchos sitios no aceptan tarjeta. Saca yenes en el 7-Eleven (tienen ATMs internacionales).", category: "money", timing: "anytime" },
    { id: "tokyo-shoes", emoji: "👟", title: "Quítate los zapatos", body: "En templos, ryokans, muchos restaurantes y casas. Lleva calcetines presentables siempre.", category: "etiquette", timing: "anytime" },
    { id: "tokyo-quiet", emoji: "🤫", title: "Silencio en el metro", body: "No hables por teléfono ni en voz alta. Es una regla social muy fuerte.", category: "etiquette", timing: "anytime" },
    { id: "tokyo-konbini", emoji: "🏪", title: "Konbinis = tu mejor amigo", body: "7-Eleven, Lawson, FamilyMart: comida increíble 24h por €3-5, WiFi, ATMs, impresión.", category: "food", timing: "anytime" },
    { id: "tokyo-trash", emoji: "🗑️", title: "No hay papeleras", body: "Lleva bolsa para tu basura. Solo hay papeleras en konbinis y estaciones.", category: "practical", timing: "anytime" },
  ],
  london: [
    { id: "london-oyster", emoji: "🚇", title: "Contactless > Oyster", body: "Tu tarjeta bancaria contactless funciona igual que Oyster y tiene cap diario. No hace falta comprar nada.", category: "transport", timing: "morning" },
    { id: "london-tip", emoji: "💷", title: "Propina: 10-12.5% opcional", body: "Muchos restaurantes añaden 12.5% de servicio. Revisa la cuenta antes de dejar propina extra.", category: "money", timing: "anytime" },
    { id: "london-free", emoji: "🏛️", title: "Museos principales gratis", body: "British Museum, Tate, National Gallery, V&A, Natural History... todos gratuitos.", category: "money", timing: "anytime" },
    { id: "london-pub", emoji: "🍺", title: "En el pub se pide en barra", body: "No esperes camarero en la mesa. Ve a la barra, pide y paga al momento.", category: "etiquette", timing: "evening" },
  ],
  barcelona: [
    { id: "bcn-t-casual", emoji: "🚇", title: "T-casual = 10 viajes", body: "€11.35 para 10 viajes en metro+bus+tram. Mucho mejor que billetes sueltos.", category: "transport", timing: "morning" },
    { id: "bcn-siesta", emoji: "😴", title: "Horario de siesta", body: "Muchas tiendas cierran 14:00-17:00. Planifica compras por la mañana o al final de la tarde.", category: "practical", timing: "afternoon" },
    { id: "bcn-beach", emoji: "🏖️", title: "Playa: cuidado con las cosas", body: "No dejes nada desatendido en la playa. Los robos son frecuentes, especialmente en la Barceloneta.", category: "safety", timing: "anytime" },
    { id: "bcn-sagrada", emoji: "⛪", title: "Sagrada Familia: reserva meses antes", body: "Se agotan las entradas rápido. Compra con al menos 2-3 semanas de antelación.", category: "practical", timing: "anytime" },
    { id: "bcn-vermouth", emoji: "🍷", title: "Hora del vermut", body: "Tradición dominical: vermut + olivas + anchoas. El Born y Gràcia son los mejores barrios.", category: "food", timing: "morning" },
  ],
  madrid: [
    { id: "mad-abono", emoji: "🚇", title: "Abono turístico", body: "Si estás 3+ días, el abono turístico zona A sale muy bien: metro+bus ilimitados.", category: "transport", timing: "morning" },
    { id: "mad-dinner", emoji: "🍽️", title: "Se cena a las 21:00+", body: "Los restaurantes empiezan a servir cena a las 20:30-21:00. Antes de eso solo tapas.", category: "food", timing: "evening" },
    { id: "mad-free-tapas", emoji: "🫒", title: "La tapa viene con la caña", body: "En muchos bares de La Latina y Lavapiés, la tapa es gratis con cada bebida.", category: "money", timing: "evening" },
    { id: "mad-retiro", emoji: "🌳", title: "Retiro por la mañana", body: "Ve temprano (9-10h) para disfrutarlo sin multitudes. El Palacio de Cristal es mágico con luz matutina.", category: "practical", timing: "morning" },
  ],
  amsterdam: [
    { id: "ams-bike", emoji: "🚲", title: "Cuidado con los carriles bici", body: "NUNCA camines por el carril bici rojo. Los ciclistas van rápido y no frenan.", category: "safety", timing: "anytime" },
    { id: "ams-iamsterdam", emoji: "🎫", title: "I amsterdam City Card", body: "Si visitas 3+ museos, sale a cuenta. Incluye transporte público ilimitado.", category: "money", timing: "morning" },
  ],
  lisbon: [
    { id: "lis-28", emoji: "🚃", title: "Tram 28: madruga o evítalo", body: "Es un horno turístico después de las 10:00. Ve a las 8:30 o haz la ruta a pie, que es mejor.", category: "transport", timing: "morning" },
    { id: "lis-ginjinha", emoji: "🍒", title: "Prueba la ginjinha", body: "Licor de guindas en vasito de chocolate por €1.50. A Ginjinha (Rossio) es la más famosa.", category: "food", timing: "evening" },
    { id: "lis-hills", emoji: "🏔️", title: "Lisboa = colinas", body: "Lleva calzado cómodo y plano. Las calçadas (adoquines) son resbaladizas cuando llueve.", category: "practical", timing: "anytime" },
  ],
  berlin: [
    { id: "ber-cash", emoji: "💶", title: "Alemania = efectivo", body: "Muchos restaurantes y bares solo aceptan efectivo. Lleva siempre billetes pequeños.", category: "money", timing: "anytime" },
    { id: "ber-sunday", emoji: "🔒", title: "Domingos todo cerrado", body: "Casi todas las tiendas cierran los domingos. Compra lo que necesites el sábado.", category: "practical", timing: "anytime" },
    { id: "ber-pfand", emoji: "♻️", title: "Pfand = devuelve las botellas", body: "Las botellas tienen depósito (€0.08-0.25). Devuélvelas en la máquina del súper.", category: "money", timing: "anytime" },
  ],
  seoul: [
    { id: "seoul-tmoney", emoji: "🚇", title: "T-money card", body: "Recárgala en cualquier konbini. Funciona en metro, bus y taxis.", category: "transport", timing: "morning" },
    { id: "seoul-soju", emoji: "🍶", title: "Soju etiquette", body: "Nunca te sirvas tú mismo. Sirve a los demás (especialmente mayores) con las dos manos.", category: "etiquette", timing: "evening" },
    { id: "seoul-wifi", emoji: "📶", title: "WiFi gratis en todas partes", body: "Metro, cafés, konbinis... no necesitas SIM si no sales del centro.", category: "practical", timing: "anytime" },
  ],
  dubai: [
    { id: "dubai-dress", emoji: "👗", title: "Código de vestimenta", body: "En malls y zonas públicas: hombros y rodillas cubiertas. En la playa y hoteles es más relajado.", category: "etiquette", timing: "anytime" },
    { id: "dubai-metro", emoji: "🚇", title: "Metro Gold Class", body: "Si quieres espacio y A/C extra, el vagón Gold cuesta solo un poco más y merece.", category: "transport", timing: "anytime" },
    { id: "dubai-friday", emoji: "🕌", title: "Viernes = día sagrado", body: "Muchos sitios abren tarde los viernes (después de la oración). Planifica en consecuencia.", category: "practical", timing: "morning" },
  ],
  "mexico city": [
    { id: "cdmx-uber", emoji: "🚗", title: "Uber/DiDi > Taxis", body: "Más seguro y más barato. Los taxis de la calle pueden ser estafa o inseguros.", category: "transport", timing: "anytime" },
    { id: "cdmx-water", emoji: "💧", title: "No bebas agua del grifo", body: "Compra agua embotellada o lleva un filtro. Los locales tampoco la beben.", category: "safety", timing: "anytime" },
    { id: "cdmx-street-food", emoji: "🌮", title: "Street food = la mejor comida", body: "Los puestos con cola de locales son los buenos. Tacos al pastor en cualquier esquina por €1.", category: "food", timing: "anytime" },
  ],
}

// ─── Matching engine ──────────────────────────────────────────────────────────

function normalizeDestination(destination: string): string {
  const d = destination.toLowerCase().trim()

  // City aliases
  const aliases: Record<string, string> = {
    roma: "rome",
    parís: "paris",
    tokio: "tokyo",
    londres: "london",
    seúl: "seoul",
    dubái: "dubai",
    "ciudad de méxico": "mexico city",
    cdmx: "mexico city",
    ámsterdam: "amsterdam",
    berlín: "berlin",
    lisboa: "lisbon",
  }

  return aliases[d] ?? d
}

export function getLocalTips(
  destination: string,
  context?: { timeOfDay?: "morning" | "afternoon" | "evening" }
): LocalTip[] {
  const key = normalizeDestination(destination)
  const tips = TIPS_DB[key]
  if (!tips) return []

  if (context?.timeOfDay) {
    // Prioritize time-relevant tips but include "anytime" ones too
    const timeTips = tips.filter(t => t.timing === context.timeOfDay)
    const anytimeTips = tips.filter(t => t.timing === "anytime")
    // Return time-specific first, then anytime, max 5
    return [...timeTips, ...anytimeTips].slice(0, 5)
  }

  return tips.slice(0, 5)
}

export function getAllLocalTips(destination: string): LocalTip[] {
  const key = normalizeDestination(destination)
  return TIPS_DB[key] ?? []
}
