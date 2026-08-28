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
}

const de: VisualizerStrings = {
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
  privacyNote: "Ihr Foto wird nur in Ihrem Browser verarbeitet und nie hochgeladen.",
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
  privacyNote: "Your photo is processed in your browser only and never uploaded.",
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
  privacyNote: "Su foto se procesa solo en su navegador y nunca se sube.",
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
