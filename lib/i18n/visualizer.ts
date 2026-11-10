/**
 * Self-contained strings for the standalone /visualizer route (the rest of
 * the site localizes through lib/i18n/dictionaries via the [locale] tree,
 * which this route deliberately sits outside of — see app/visualizer/README.md).
 */

export type VisualizerLocale = "de" | "en" | "es";

export interface VisualizerStrings {
  title: string;
  subtitle: string;
  stepPhoto: string;
  stepWall: string;
  stepPanels: string;
  takePhoto: string;
  uploadPhoto: string;
  presetLabel: string;
  privacyNote: string;
  detecting: string;
  autoDetect: string;
  cornersHint: string;
  confirmWall: string;
  editWall: string;
  retake: string;
  wallHeight: string;
  orientationLabel: string;
  horizontal: string;
  vertical: string;
  panelsUnit: string;
  adjustHint: string;
  addToCart: string;
  adding: string;
  added: string;
  cartError: string;
  saveImage: string;
  share: string;
  startOver: string;
  photoHeading: string;
  photoHelp: string;
  finishLabel: string;
  adjustCorners: string;
  adjustCoverage: string;
  doneAdjusting: string;
  resetLayout: string;
  newPhoto: string;
  wallHeightHelp: string;
  panelsLabel: string;
  areaLabel: string;
  autoDetectFailed: string;
  cornerStepTitle: string;
  analysing: string;
  analysingHint: string;
  measuredNote: string;
  estimatedNote: string;
  checkWallNote: string;
  detectionUnavailable: string;
  panelRun: string;
  widePanels: string;
  narrower: string;
  wider: string;
  wallSize: string;
  looksRight: string;
  retryDetection: string;
  compare: string;
  compareBefore: string;
  compareAfter: string;
  otherWall: string;
  otherWallHint: string;
  whatsappQuote: string;
  whatsappMessage: string;
  shareImage: string;
  cancel: string;
  layoutLabel: string;
}

const de: VisualizerStrings = {
  retryDetection: "Erneut erkennen",
  compare: "Vorher / Nachher",
  compareBefore: "Vorher",
  compareAfter: "Nachher",
  otherWall: "Andere Wand",
  otherWallHint: "Tippen Sie auf die Wand, die Sie verkleiden möchten.",
  whatsappQuote: "Angebot per WhatsApp",
  whatsappMessage: "Hallo! Ich habe meine Wand im Akurock Visualizer geplant:\n• Oberfläche: {finish}\n• Paneele: {panels} ({area} m²), {orientation}\n• Wand: {wall} m\n• Richtpreis: {price}\nBitte senden Sie mir ein Angebot.",
  shareImage: "Bild teilen",
  cancel: "Abbrechen",
  layoutLabel: "Anordnung",
  analysing: "Wand wird erkannt …",
  analysingHint: "Die KI findet die Wand und erkennt, was davor steht — direkt auf Ihrem Gerät.",
  measuredNote: "Aus Ihrem Foto gemessen",
  estimatedNote: "Größe geschätzt — Wandhöhe bitte prüfen",
  checkWallNote: "Wand nicht sicher erkannt — bitte Ecken prüfen.",
  detectionUnavailable: "Automatische Erkennung nicht verfügbar — Ecken bitte selbst setzen.",
  panelRun: "Paneelfläche",
  widePanels: "Paneele breit",
  narrower: "Schmaler",
  wider: "Breiter",
  wallSize: "Wand",
  looksRight: "Passt",
  photoHeading: "Foto Ihrer Wand",
  photoHelp: "Frontal aufgenommen wird die Paneelmenge am genauesten — oder starten Sie mit einem Beispielraum.",
  finishLabel: "Oberfläche",
  adjustCorners: "Ecken anpassen",
  adjustCoverage: "Fläche anpassen",
  doneAdjusting: "Fertig",
  resetLayout: "Anordnung zurücksetzen",
  newPhoto: "Neues Foto",
  wallHeightHelp: "Die eine Angabe, die Lattenbreite und Paneelanzahl maßstabsgetreu macht.",
  panelsLabel: "Paneele",
  areaLabel: "m²",
  autoDetectFailed: "Wandkanten nicht gefunden — ziehen Sie die Ecken an die Wand.",
  cornerStepTitle: "Die 4 Wandecken setzen",
  title: "Akurock Raumvisualizer",
  subtitle: "Ihre Wand mit echten Akurock Paneelen — exakte Stückzahl, sofort.",
  stepPhoto: "Foto",
  stepWall: "Wand",
  stepPanels: "Paneele",
  takePhoto: "Foto aufnehmen",
  uploadPhoto: "Foto hochladen",
  presetLabel: "Oder Beispielraum wählen",
  privacyNote: "Ihr Foto bleibt auf Ihrem Gerät — es wird nirgendwo hochgeladen.",
  detecting: "Wand wird erkannt …",
  autoDetect: "Wand automatisch erkennen",
  cornersHint: "Ecken an die Wandkanten ziehen — die Lupe hilft beim Feinjustieren.",
  confirmWall: "Wand bestätigen",
  editWall: "Wand bearbeiten",
  retake: "Neues Foto",
  wallHeight: "Wandhöhe",
  orientationLabel: "Ausrichtung",
  horizontal: "Horizontal",
  vertical: "Vertikal",
  panelsUnit: "Paneele",
  adjustHint: "Fläche ziehen zum Verschieben · Ecken ziehen zum Anpassen",
  addToCart: "In den Warenkorb",
  adding: "Wird hinzugefügt …",
  added: "Hinzugefügt ✓",
  cartError: "Konnte nicht hinzugefügt werden — bitte erneut versuchen.",
  saveImage: "Bild speichern",
  share: "Teilen",
  startOver: "Von vorn",
};

const en: VisualizerStrings = {
  retryDetection: "Detect again",
  compare: "Before / after",
  compareBefore: "Before",
  compareAfter: "After",
  otherWall: "Other wall",
  otherWallHint: "Tap the wall you want to panel.",
  whatsappQuote: "Get a quote on WhatsApp",
  whatsappMessage: "Hello! I planned my wall in the Akurock visualizer:\n• Finish: {finish}\n• Panels: {panels} ({area} m²), {orientation}\n• Wall: {wall} m\n• Guide price: {price}\nPlease send me a quote.",
  shareImage: "Share image",
  cancel: "Cancel",
  layoutLabel: "Layout",
  analysing: "Finding your wall…",
  analysingHint: "The AI finds the wall and spots what stands in front of it — right on your device.",
  measuredNote: "Measured from your photo",
  estimatedNote: "Size estimated — check the wall height",
  checkWallNote: "The wall wasn’t found confidently — check the corners.",
  detectionUnavailable: "Automatic detection is unavailable — set the corners yourself.",
  panelRun: "Panel area",
  widePanels: "panels wide",
  narrower: "Narrower",
  wider: "Wider",
  wallSize: "Wall",
  looksRight: "Looks right",
  photoHeading: "Add a photo of your wall",
  photoHelp: "A straight-on photo gives the most accurate panel count, or start from a preset room.",
  finishLabel: "Finish",
  adjustCorners: "Adjust corners",
  adjustCoverage: "Adjust coverage",
  doneAdjusting: "Done",
  resetLayout: "Reset panel layout",
  newPhoto: "New photo",
  wallHeightHelp: "The single reference that makes slat width and panel count true to scale.",
  panelsLabel: "panels",
  areaLabel: "m²",
  autoDetectFailed: "Couldn’t find the wall edges — drag the corners onto the wall.",
  cornerStepTitle: "Set the 4 wall corners",
  title: "Akurock Wall Visualizer",
  subtitle: "Your wall in real Akurock panels — exact panel count, instantly.",
  stepPhoto: "Photo",
  stepWall: "Wall",
  stepPanels: "Panels",
  takePhoto: "Take a photo",
  uploadPhoto: "Upload a photo",
  presetLabel: "Or try a preset room",
  privacyNote: "Your photo stays on your device — it is never uploaded.",
  detecting: "Detecting wall …",
  autoDetect: "Auto-detect wall",
  cornersHint: "Drag the corners onto the wall edges — the loupe helps you be precise.",
  confirmWall: "Confirm wall",
  editWall: "Edit wall",
  retake: "New photo",
  wallHeight: "Wall height",
  orientationLabel: "Orientation",
  horizontal: "Horizontal",
  vertical: "Vertical",
  panelsUnit: "panels",
  adjustHint: "Drag the area to move · drag corners to resize",
  addToCart: "Add to cart",
  adding: "Adding …",
  added: "Added ✓",
  cartError: "Couldn't add to cart — please try again.",
  saveImage: "Save image",
  share: "Share",
  startOver: "Start over",
};

const es: VisualizerStrings = {
  retryDetection: "Detectar de nuevo",
  compare: "Antes / después",
  compareBefore: "Antes",
  compareAfter: "Después",
  otherWall: "Otra pared",
  otherWallHint: "Toque la pared que quiere revestir.",
  whatsappQuote: "Presupuesto por WhatsApp",
  whatsappMessage: "¡Hola! He planificado mi pared en el visualizador Akurock:\n• Acabado: {finish}\n• Paneles: {panels} ({area} m²), {orientation}\n• Pared: {wall} m\n• Precio orientativo: {price}\nPor favor, envíenme un presupuesto.",
  shareImage: "Compartir imagen",
  cancel: "Cancelar",
  layoutLabel: "Disposición",
  analysing: "Detectando su pared…",
  analysingHint: "La IA encuentra la pared y detecta lo que hay delante, en su propio dispositivo.",
  measuredNote: "Medido desde su foto",
  estimatedNote: "Tamaño estimado — compruebe la altura",
  checkWallNote: "La pared no se detectó con seguridad — revise las esquinas.",
  detectionUnavailable: "La detección automática no está disponible — marque las esquinas.",
  panelRun: "Superficie de paneles",
  widePanels: "paneles de ancho",
  narrower: "Más estrecho",
  wider: "Más ancho",
  wallSize: "Pared",
  looksRight: "Correcto",
  photoHeading: "Añada una foto de su pared",
  photoHelp: "Una foto frontal da el recuento de paneles más preciso, o empiece con una sala de ejemplo.",
  finishLabel: "Acabado",
  adjustCorners: "Ajustar esquinas",
  adjustCoverage: "Ajustar superficie",
  doneAdjusting: "Listo",
  resetLayout: "Restablecer distribución",
  newPhoto: "Nueva foto",
  wallHeightHelp: "La única referencia que hace que el ancho de lama y el número de paneles sean fieles a escala.",
  panelsLabel: "paneles",
  areaLabel: "m²",
  autoDetectFailed: "No se encontraron los bordes — arrastre las esquinas hasta la pared.",
  cornerStepTitle: "Marque las 4 esquinas",
  title: "Visualizador Akurock",
  subtitle: "Su pared con paneles Akurock reales — cantidad exacta, al instante.",
  stepPhoto: "Foto",
  stepWall: "Pared",
  stepPanels: "Paneles",
  takePhoto: "Tomar una foto",
  uploadPhoto: "Subir una foto",
  presetLabel: "O pruebe una sala de ejemplo",
  privacyNote: "Su foto permanece en su dispositivo: nunca se sube.",
  detecting: "Detectando pared …",
  autoDetect: "Detectar pared automáticamente",
  cornersHint: "Arrastre las esquinas a los bordes de la pared — la lupa le ayuda a ser preciso.",
  confirmWall: "Confirmar pared",
  editWall: "Editar pared",
  retake: "Nueva foto",
  wallHeight: "Altura de la pared",
  orientationLabel: "Orientación",
  horizontal: "Horizontal",
  vertical: "Vertical",
  panelsUnit: "paneles",
  adjustHint: "Arrastre el área para mover · esquinas para ajustar",
  addToCart: "Añadir al carrito",
  adding: "Añadiendo …",
  added: "Añadido ✓",
  cartError: "No se pudo añadir — inténtelo de nuevo.",
  saveImage: "Guardar imagen",
  share: "Compartir",
  startOver: "Empezar de nuevo",
};

const DICTIONARIES: Record<VisualizerLocale, VisualizerStrings> = { de, en, es };

export function resolveVisualizerLocale(
  searchLang: string | null,
  navigatorLanguage: string | undefined,
): VisualizerLocale {
  for (const candidate of [searchLang, navigatorLanguage]) {
    const two = candidate?.slice(0, 2).toLowerCase();
    if (two === "de" || two === "en" || two === "es") return two;
  }
  return "de";
}

export function getVisualizerStrings(locale: VisualizerLocale): VisualizerStrings {
  return DICTIONARIES[locale];
}
