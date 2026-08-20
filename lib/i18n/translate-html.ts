import type { Locale } from './config';
import { getDictionary } from './get-dictionary';
import type { TranslationKey } from './dictionaries/de';

// Pairs of [germanText, dictionaryKey] sorted longest-first to prevent partial matches
const HTML_REPLACEMENTS: [string, TranslationKey][] = [
  // ========== VERY LONG STRINGS (100+ chars) ==========
  ['Bereit, deinen Raum in ein Meisterwerk zu verwandeln? Teile deine Vision mit uns und lasse uns diese gemeinsam verwirklichen!', 'mega.readyToTransform'],
  ['Ja, ich m\u00f6chte den Newsletter von stonearts\u00ae erhalten, und ich akzeptiere die Bedingungen der', 'footer.newsletterConsent'],
  ['Es sind die vielen kleinen Schritte, die in einem vollendeten Produkt zum Ausdruck kommen. Es ist die Gesamtheit des Prozesses, in dem sich unsere Passion f\u00fcr unser Handwerk widerspiegelt.', 'product.manySmallSteps'],
  ['Das Akustikpaneel besteht aus einem 9 mm dicken Akustikfilz, an dem die Lamellen befestigt sind. Der Filz wird aus recyceltem PET-Kunststoff hergestellt, haupts\u00e4chlich aus Plastikflaschen. Die Lamellen bestehen aus MDF mit einer echten Steinfurnieroberfl\u00e4che. Unser gesamtes Holz stammt aus nachhaltiger Forstwirtschaft. Dabei wird sichergestellt, dass mehr B\u00e4ume nachwachsen, als gef\u00e4llt werden.', 'product.faq.compositionAnswer'],
  ['Die Installation der stonearts\u00ae Akustikpaneele ist bemerkenswert einfach. Sie sind so konzipiert, dass sie direkt auf Oberfl\u00e4chen geklebt oder durch den Akustikfilz hindurch verschraubt werden k\u00f6nnen, was flexible und unkomplizierte Montagem\u00f6glichkeiten bietet.', 'product.faq.installAnswer'],
  ['Wir bem\u00fchen uns, alle vorr\u00e4tigen Produkte innerhalb von 5-10 Werktagen zu versenden und zuzustellen. Wir senden dir eine E-Mail, sobald die Bestellung versandt wurde, und unser Kurierdienst wird dir am Tag der Bestellung die Sendungsverfolgungsnummer zukommen lassen.', 'product.shippingInfo'],
  ['Das Akurock-Akustikpaneel von stonearts\u00ae ist ein in \u00d6sterreich entworfenes, handgefertigtes Produkt mit einer 100% nat\u00fcrlichen Steinoberfl\u00e4che. Es zeichnet sich nicht nur durch hervorragende Schallabsorption aus, sondern ist auch umweltfreundlich, da es upcycelten Akustikfilz verwendet.', 'product.akurockSustainability'],
  ['Wie pflege ich meine Akurock-Akustikpaneele? Ein schneller Feger, Staubsauger oder feuchtes Tuch \u2013 und sie sind wie neu! F\u00fcr anspruchsvolle F\u00e4lle nutze unseren Nano-Versiegeler aus dem Shop. Bei stonearts\u00ae soll Pflege einfach sein.', 'product.careInstructions'],
  ['Verwandle deinen Raum in etwas Au\u00dfergew\u00f6hnliches mit Akurock. Mit authentischen, aus Stein gefertigten Akustikpaneelen schaffst du dir eine ruhige Oase mitten im L\u00e4rm des Lebens.', 'samples.transformSpace'],
  ['Die Zusammensetzung von Akurock erm\u00f6glicht eine au\u00dfergew\u00f6hnlich einfache Installation, indem die Paneele direkt auf den Akustikfilz geklebt oder durch ihn hindurch verschraubt werden.', 'product.installAccordionDesc'],
  ['Ja! Unsere stonearts\u00ae Akustikpaneele haben eine 100% nat\u00fcrliche Steinoberfl\u00e4che. Jedes Paneel ist ein Unikat und jede Oberfl\u00e4che erz\u00e4hlt eine Geschichte, die Millionen Jahre alt ist \u{1F60A}', 'product.faq.naturalSurfaceAnswer'],
  ['sind in der Gr\u00f6\u00dfe 2400x600 mm erh\u00e4ltlich, mit einer Dicke von 23 mm. Diese Paneele sind so konzipiert, dass sie nahtlos aneinandergef\u00fcgt werden k\u00f6nnen, was eine einheitliche und durchgehende Optik erm\u00f6glicht.', 'product.panelSpecDescription'],
  ['Die Zusammensetzung von Akurock erm\u00f6glicht eine au\u00dfergew\u00f6hnlich einfache Installation, die keinen Fachmann erfordert.', 'product.easyInstall'],
  ['Keine Fachkr\u00e4fte n\u00f6tig \u2013 folge diesem Link, um zu erfahren, wie du dein DIY-Projekt starten kannst.', 'product.noSpecialistsNeeded'],
  ['. Dieses handgefertigte Produkt besticht nicht nur durch seine \u00fcberlegene Schallabsorption, sondern unterst\u00fctzt durch den Einsatz von upgecyceltem Akustikfilz auch den Umweltschutz.', 'product.keyFeaturesDesc2'],
  ['Das Akurock-Akustikpaneel von stonearts\u00ae wird in \u00d6sterreich entwickelt und \u00fcberzeugt mit einer Oberfl\u00e4che aus ', 'product.keyFeaturesDesc'],

  // ========== INSTALLATION GUIDE \u2014 Preparation + Steps (longest first) ==========
  ['Mit deinem Werkzeug ausgestattet kann die akustische Verwandlung deines Raumes beginnen. Den Gro\u00dfteil des ben\u00f6tigten Werkzeugs und Zubeh\u00f6rs findest du in der Add-Ons-Kategorie unseres Shops.', 'install.prep.outro'],
  ['Bevor du deine AKUROCK Akustikpaneele montierst, lege das richtige Werkzeug und Material bereit. Du brauchst kein ganzes Orchester \u2013 ein kleines Ensemble gen\u00fcgt:', 'install.prep.intro'],
  ['Eine S\u00e4ge zum Zuschneiden, Bohrer bzw. Akkuschrauber zur Montage, 40-mm- und optional 15-mm-Schrauben zum Befestigen sowie Ma\u00dfband und Bleistift zum Planen.', 'install.prep.tools'],
  ['Pr\u00fcfe zum Schluss alle Fugen und Kanten. Gereinigt wird einfach mit einem feuchten Tuch; f\u00fcr anspruchsvolle Stellen nutzt du den Nano-Versiegeler aus dem Shop.', 'install.step8.body'],
  ['Alternativ verschraubst du die Paneele mit den 40-mm-Schrauben durch den Akustikfilz hindurch in die Wand \u2013 f\u00fcr eine besonders sichere Befestigung.', 'install.step6.body'],
  ['Schneide die Paneele mit einer S\u00e4ge auf das ben\u00f6tigte Ma\u00df \u2013 s\u00e4ge dabei von der R\u00fcckseite des Akustikfilzes her, um die Steinoberfl\u00e4che zu schonen.', 'install.step4.body'],
  ['Lege die Paneele zun\u00e4chst lose vor der Wand aus, um Maserung und Anordnung festzulegen und den Verschnitt an den R\u00e4ndern gering zu halten.', 'install.step3.body'],
  ['Stelle sicher, dass die Wand sauber, trocken und tragf\u00e4hig ist \u2013 entferne losen Putz, Staub und Fett, damit Kleber und Schrauben zuverl\u00e4ssig halten.', 'install.step1.body'],
  ['Miss die Wandfl\u00e4che mit dem Ma\u00dfband und markiere mit dem Bleistift eine waagrechte Startlinie, an der du die erste Paneelreihe ausrichtest.', 'install.step2.body'],
  ['F\u00fcge die Paneele nahtlos aneinander und arbeite dich Reihe f\u00fcr Reihe vor, sodass Lamellen und Fugen \u00fcber die gesamte Fl\u00e4che durchlaufen.', 'install.step7.body'],
  ['Trage den Wandkleber gleichm\u00e4\u00dfig auf die Filzr\u00fcckseite auf, setze das Paneel an der Startlinie an und dr\u00fccke es fest gegen die Wand.', 'install.step5.body'],
  ['Reihe f\u00fcr Reihe montieren', 'install.step7.title'],
  ['Variante B: Verschrauben', 'install.step6.title'],
  ['Untergrund vorbereiten', 'install.step1.title'],
  ['Abschluss &amp; Pflege', 'install.step8.title'],
  ['Paneele zuschneiden', 'install.step4.title'],
  ['Variante A: Kleben', 'install.step5.title'],
  ['Verlegung planen', 'install.step3.title'],
  ['Wand ausmessen', 'install.step2.title'],
  ['Vorbereitung', 'install.prep.label'],
  ['Schritt 1', 'install.step1.label'],
  ['Schritt 2', 'install.step2.label'],
  ['Schritt 3', 'install.step3.label'],
  ['Schritt 4', 'install.step4.label'],
  ['Schritt 5', 'install.step5.label'],
  ['Schritt 6', 'install.step6.label'],
  ['Schritt 7', 'install.step7.label'],
  ['Schritt 8', 'install.step8.label'],

  // ========== LONG STRINGS (60-100 chars) ==========
  ['Wir helfen dir, deinen Raum zum Singen zu bringen, mit einer Mischung aus skandinavischem und japanischem Design, das stilvoll und funktional ist. ', 'content.weHelp'],
  ['Schritt-f\u00fcr-Schritt-Anleitung f\u00fcr die m\u00fchelose Umgestaltung deines Raumes.', 'mega.stepByStep'],
  ['Wir gehen als Team und Unternehmen einen einzigartigen Weg in eine verantwortungsvolle Zukunft.', 'content.aboutUs.uniquePath'],
  ['Unsere Reise begann in Indien am Fu\u00dfe des Aravalli-Gebirges, wo die Natur seit Millionen von Jahren beeindruckende Gesteine formt.', 'content.aboutUs.ourJourney'],
  ['Unsere Leidenschaft gilt dem Stein, der Verbundenheit zur Natur und den Menschen, die gestalten wollen.', 'content.aboutUs.ourPassion'],
  ['Es geht nicht nur um Stil, schaffe dir gleichzeitig ein gesundes Klangumfeld.', 'product.notJustStyle'],
  ['&quot;Den Rhythmus des Lebens feiernd, tragen unsere Heime die sch\u00f6nen Spuren der Zeit. Als Symbole einer gemeinsamen Reise.&quot;', 'content.rhythmOfLife'],
  ['Ist die Installation der stonearts\u00ae Akustikpaneele schwierig?', 'product.faq.installDifficult'],
  ['Ist das wirklich eine nat\u00fcrliche Steinoberfl\u00e4che?', 'product.faq.naturalSurface'],
  ['Woraus besteht das AKUROCK-Akustikpaneel?', 'product.faq.composition'],
  ['Ein gesundes Klangumfeld zu schaffen, war noch nie so einfach.', 'content.healthySound'],
  ['Mit Liebe handgefertigt ist jedes St\u00fcck so einzigartig wie seine Herkunft.', 'content.handcrafted'],
  ['Es f\u00fchlt sich einfach anders an, nimm es in die Hand!', 'content.feelsDifferent'],
  ['Es ist so einfach wie das Aufh\u00e4ngen deiner Bilder.', 'content.easyAsHanging'],
  ['Modern und ruhig? Dein Zuhause kann beides.', 'content.modernQuiet'],
  ['Mehr als nur ein Akustikpaneel, eine Symphonie aus Stein und Design.', 'hero.subheading'],
  ['Welche Akurock-Akustikpaneele passen zu dir?', 'slider.whichPanels'],
  [', indem die Paneele direkt aufgeklebt oder durch den Akustikfilz hindurch verschraubt werden.', 'product.installTabSuffix'],
  ['innovativ in Handarbeit verarbeitet zu flexiblen und leichten Natursteinplatten.', 'product.innovativelyProcessed'],
  ['innovativ verarbeitet zu flexiblen und leichten Steinplatten.', 'product.innovativelyProcessedShort'],
  ['Die Zusammensetzung der Akurock-Akustikpaneele erm\u00f6glicht eine', 'product.remarkablySimple'],
  ['Die angefragte Menge \u00fcberschreitet die Verf\u00fcgbarkeit.', 'product.qtyExceedsAvail'],
  ['Es ist fast so einfach wie deinen Bilderrahmen aufzuh\u00e4ngen.', 'product.easyAsHanging'],
  ['Produkt in dieser Menge nicht verf\u00fcgbar.', 'product.notAvailableQty'],
  ['Berechne die ben\u00f6tigte Menge f\u00fcr deine Wand.', 'product.calculateAmount'],
  ['90% geringere \u00f6kologische Belastung als Massivstein.', 'product.lessEcoImpact'],
  ['Wieviel Akurock Acoustic Panels brauche ich?', 'product.howMany'],
  ['Ausgew\u00e4hlter Marmor, Sandstein und Schiefer,', 'product.selectedMarble'],
  ['au\u00dfergew\u00f6hnlich einfache Installation', 'product.exceptionallyEasy'],
  ['Steine fl\u00fcstern die Geschichten der Jahrtausende.', 'product.stonesWhisper'],
  ['Alles was du brauchst, um dir ein Bild zu machen.', 'product.allYouNeed'],
  ['Geboren aus den Elementen, ein Echo der Ewigkeit.', 'product.bornFromElements'],
  ['Gestalten ein gesundes Klangumfeld mit Stil.', 'product.healthySoundStyle'],
  ['Liebe was du tust und tue was du liebst.', 'content.aboutUs.loveWhatYouDo'],

  // ========== MEDIUM STRINGS (30-60 chars) ==========
  ['Ber\u00fchrt von den Elementen durch Jahrtausende.', 'mega.touchedByElements'],
  ['Schau dir AKUROCK vorab an deiner Wand an.', 'mega.seeOnWall'],
  ['Schau dir AKUROCK an deiner Wand an.', 'content.discoverWall'],
  ['Erschaffen m\u00fchelos eine moderne Oase.', 'mega.createOasis'],
  ['Wie funktioniert ein Akustikpaneel?', 'mega.howAcoustic'],
  ['Schwierigkeiten bei der Entscheidung?', 'slider.hardToDecide'],
  ['Millionen Jahre auf einem d\u00fcnnen Blatt.', 'mega.millionsOfYears'],
  ['Wie installiere ich AKUROCK?', 'mega.howToInstall'],
  ['Entdecke AKUROCK an deiner Wand.', 'slider.discoverOnWall'],
  ['Schaffe einzigartige Lebensr\u00e4ume!', 'content.createSpaces'],
  ['100% nat\u00fcrliche Steinoberfl\u00e4che', 'product.naturalSurface'],
  ['Stein so d\u00fcnn wie ein Blatt Papier.', 'product.stoneAsThin'],
  ['Reduziert L\u00e4rm und Nachhall', 'content.reducesNoise'],
  ['Deine Wand, dein Meisterwerk.', 'content.yourWall'],
  ['Ein gesundes Raumklima mit Stil.', 'slider.healthyClimate'],
  ['Probiere es an deiner Wand!', 'mega.tryOnWall'],
  ['Probiere es an deiner Wand.', 'content.tryOnWall'],
  ['Das Streben nach Nachhaltigkeit.', 'product.pursuitSustainability'],
  ['Passt es zu deinem Raum?', 'product.fitsYourRoom'],
  ['Nachhaltige Verantwortung', 'content.sustainableResp'],
  ['Nimm es in die Hand!', 'mega.takeInHand'],
  ['F\u00fchle und sehe es selbst.', 'mega.feelAndSee'],
  ['Lass dich inspirieren!', 'mega.getInspired'],
  ['Verwandle dein Zuhause.', 'slider.transformHome'],
  ['Visualizer probieren.', 'slider.tryVisualizer'],
  ['Gestalte dein Zuhause.', 'content.designHome'],
  ['Akurock Akustikpaneele', 'mega.acousticPanels'],
  ['Zum Einkaufswagen', 'cart.goToCart'],
  ['Einen Augenblick...', 'cart.loading'],

  // ========== PRODUCT PAGE - Tabs/Accordion Headers ==========
  ['Produktdetails', 'product.tab.productDetails'],
  ['Hauptmerkmale', 'product.tab.keyFeatures'],
  ['Installation &amp; Downloads', 'product.tab.installDownloads'],
  ['\u00dcber unseren Stein', 'product.tab.aboutStone'],

  // PRODUCT PAGE - Tab/Accordion Content
  ['Gemacht, um anders zu sein.', 'product.madeToBeDifferent'],
  ['Von der Natur geformt, von stonearts\u00ae veredelt.', 'product.shapedByNatureTitle'],
  ['Von der Natur geformt, von stonearts\u00ae veredelt', 'product.shapedByNature'],
  ['Verantwortung bei jedem Schritt.', 'product.responsibilityEveryStep'],
  ['Reinigen: Schnell &amp; Einfach', 'product.cleanQuickEasy'],
  ['Das originale stonearts\u00ae Akurock Akustik-Paneel', 'product.originalPanel'],
  ['Hervorragende Schallabsorption', 'product.excellentAbsorption'],
  ['Upcycelter Akustikfilz', 'product.upcycledFelt'],
  ['Schnelle und einfache Installation', 'product.quickEasyInstall'],
  ['Handgefertigt', 'product.handmade'],
  ['100% nat\u00fcrlichem Stein', 'product.naturalStoneEmphasis'],

  // PRODUCT PAGE - Captions
  ['Lamellen Design.', 'product.slatsDesign'],
  ['Soundklasse A.', 'product.soundClassA'],
  ['Du kannst Sie verschrauben.', 'product.canScrew'],
  ['Du kannst Sie kleben.', 'product.canGlue'],
  ['Millionen von Jahren...', 'product.millionsOfYearsCaption'],
  ['Holz aus nachhaltiger Forstwirtschaft', 'product.sustainableForestry'],
  ['Technisches Datenblatt', 'product.technicalDatasheet'],
  ['Installations Guide', 'product.installationsGuide'],

  // PRODUCT PAGE - Other
  ['Inkl. MwSt. zzgl. Versandkosten Versand', 'product.inclVat'],
  ['Sie ben\u00f6tigen keine Fachkr\u00e4fte', 'product.noSpecialists'],
  ['Probiere unseren Visualizer.', 'product.tryVisualizer'],
  ['auf einem d\u00fcnnen Blatt.', 'product.onThinSheet'],
  ['Konzipiert in \u00d6sterreich', 'product.designedInAustria'],
  ['Inkl. MwSt. zzgl. Versand', 'product.inclVatShort'],
  ['F\u00fchle den Unterschied.', 'product.feelTheDifference'],
  ['MIT SORGFALT HERGESTELLT', 'product.craftedWithCare'],
  ['Akurock Paneel Spezifikation', 'product.panelSpec'],
  ['Alle Zusatzprodukte', 'product.allAccessories'],
  ['Muster erkunden.', 'product.exploreSamples'],
  ['Gr\u00f6\u00dfe pro Paneel', 'product.sizeLabel'],
  ['Schrauben schwarz', 'product.screwsBlack'],
  ['Schutz &amp; Pflege', 'product.protectionCare'],
  ['Schutz & Pflege', 'product.protectionCare'],
  ['Schrauben wei\u00df', 'product.screwsWhite'],
  ['Unentschlossen?', 'product.undecided'],
  ['Hinzuf\u00fcgen..', 'product.adding'],
  ['5-10 Werktage', 'product.businessDays'],
  ['Wandkleber', 'product.wallAdhesive'],
  ['Wird hinzugef\u00fcgt...', 'product.adding'],
  ['Lieferzeit 5-10 Tage', 'product.deliveryInfo'],
  ['Lieferzeit', 'product.deliveryTime'],
  ['In den Warenkorb', 'product.addToCart'],
  ['Breite (cm)', 'product.width'],
  ['H\u00f6he (cm)', 'product.height'],
  ['Gesamtfl\u00e4che:', 'product.totalArea'],
  ['Zusatzprodukte', 'product.additionalProducts'],
  ['Datenblatt', 'product.datasheet'],
  ['Nachhaltigkeit', 'product.sustainability'],
  ['Menge', 'product.quantity'],

  // ========== CART ==========
  ['Dein Warenkorb', 'cart.yourCart'],
  ['Der Warenkorb ist leer.', 'cart.isEmpty'],
  ['Weiter zum Checkout', 'cart.continueToCheckout'],
  ['Keine Artikel gefunden.', 'cart.noItems'],
  ['Zur Kassa', 'cart.toCheckout'],
  ['Gesamt', 'cart.total'],

  // Cart - English text (for ES locale translation from EN-default cart)
  ['Your cart is empty', 'cart.empty'],
  ['Continue Shopping', 'cart.continueShopping'],
  ['Continue to Checkout', 'cart.continueCheckout'],
  ['To the checkout', 'cart.toCheckout'],
  ['Add items to your cart to continue shopping', 'cart.emptySubtitle'],
  ['In total', 'cart.inTotal'],
  ['Total', 'cart.total'],

  // ========== SAMPLE BOX PAGE ==========
  ['Hole dir die komplette <br>Kollektion und teste <br>sie alle an deiner Wand.', 'samples.getCollection'],
  ['Hole dir die komplette Kollektion und teste sie alle an deiner Wand.', 'samples.getCollection'],
  ['W\u00e4hle deine Muster und probiere sie an deiner Wand aus.', 'samples.subheading'],

  // ========== BENTO SECTIONS (with <br> tags) ==========
  ['Lebe wild. <br>Wohne leise.  <br>Dein Stein. <br>Deine Ruhe.', 'content.liveWild'],
  ['Mehr<br>erfahren', 'content.learnMore'],

  // ========== PRODUCT PAGE BOTTOM ==========
  ['Ber\u00fchren und \u00fcberzeugen.', 'product.touchAndConvince'],
  ['Visualisiere', 'product.visualize'],
  ['Alle FAQs', 'product.allFaqs'],

  // ========== NAV/FOOTER SHORT STRINGS ==========
  ['Installationsanleitung', 'mobile.installGuide'],
  ['Installationsguide', 'mega.installGuide'],
  ['Datenschutzrichtlinien.', 'footer.privacyPolicy'],
  ['Die Seele der Natur', 'mega.soulOfNature'],
  ['Kontaktiere uns', 'mega.contactUs'],
  ['Muster bestellen', 'mobile.orderSamples'],
  ['Die Seele des Steins.', 'content.soulOfStone'],
  ['Die Kunst der Natur.', 'content.artOfNature'],
  ['Beruhige den L\u00e4rm.', 'content.calmNoise'],
  ['Stein mal anders.', 'content.stoneDifferent'],
  ['Erkunde Akurock', 'content.exploreAkurock'],
  ['Erfahre mehr', 'content.learnMoreLink'],
  ['Mehr erfahren', 'product.learnMore'],
  ['wir versetzen berge', 'footer.weMoveMountains'],
  ['Verbinden wir uns', 'footer.connectWithUs'],
  ['Zahlung &amp; Versand', 'footer.paymentShipping'],
  ['Hilfe ben\u00f6tigt?', 'mobile.helpNeeded'],
  ['Brauchst du Hilfe?', 'mega.needHelp'],
  ['Hast du Fragen?', 'mega.haveQuestions'],
  ['Wir sind f\u00fcr dich da', 'mega.weAreHere'],
  ['Hier findest du eine Antwort!', 'content.faq.findAnswer'],
  ['Hier gehts zu den FAQs', 'content.contact.goToFaqs'],
  ['Jetzt Probieren', 'slider.tryNow'],
  ['Jetzt Shoppen', 'hero.shopNow'],
  ['Akurock Paneele', 'mega.akurockPanels'],
  ['Kundenservice', 'nav.customerService'],
  ['Verantwortung', 'nav.responsibility'],
  ['Unsere Steine', 'mega.ourStones'],
  ['Unser Journal', 'mega.journal'],
  ['Musterboxen', 'slider.sampleBoxes'],
  ['Deine Email', 'footer.yourEmail'],
  ['Datenschutz', 'footer.privacy'],
  ['\u00dcber uns', 'nav.aboutUs'],
  ['Naturstein', 'mega.naturalStone'],
  ['Musterbox', 'mega.sampleBox'],
  ['Zubeh\u00f6r', 'mega.accessories'],
  ['Highlight', 'mega.highlight'],
  ['Impressum', 'footer.imprint'],
  ['Galerie', 'mega.gallery'],
  ['#follow us', 'footer.followUs'],
  ['AGBs', 'footer.terms'],
  ['Kontakt', 'content.contact.heading'],
  // Visualizer (self-hosted) chrome
  ['Ziehe das Paneel auf deine Wand · zieh an den Ecken für die Perspektive', 'visualizer.hint'],
  ['Lamellenbreite', 'visualizer.slatWidth'],
  ['Eigenes Raumfoto', 'visualizer.uploadPhoto'],
  ['Zurücksetzen', 'visualizer.reset'],
];

export function translateHTML(html: string, locale: Locale): string {
  // Always prefix internal links with locale (including DE to avoid redirect hops)
  let translated = prefixInternalLinks(html, locale);

  // For German locale, only prefix links — no text translation needed
  if (locale === 'de') return translated;

  const dict = getDictionary(locale);

  for (const [germanText, key] of HTML_REPLACEMENTS) {
    const replacement = dict[key];
    if (replacement && replacement !== germanText) {
      // First try exact match (fast path)
      if (translated.includes(germanText)) {
        translated = translated.replaceAll(germanText, replacement);
      } else {
        // Fallback: flexible whitespace + <br> tag matching for multi-line HTML
        // Escape regex special chars, then replace whitespace runs with pattern
        // that matches whitespace characters AND/OR <br> tags
        const escaped = germanText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flexPattern = escaped.replace(/\s+/g, '(?:<br\\s*/?>|\\s)+');
        try {
          const regex = new RegExp(flexPattern, 'g');
          translated = translated.replace(regex, replacement);
        } catch {
          // Skip invalid patterns silently
        }
      }
    }
  }

  // Replace remaining standalone button values
  translated = translated.replaceAll('value="Warenkorb"', `value="${dict['product.addToCart']}"`);
  translated = translated.replaceAll('data-loading-text="Wird hinzugef\u00fcgt..."', `data-loading-text="${dict['product.adding']}"`);
  translated = translated.replaceAll('data-loading-text="Wird hinzugef\u00fcgt.."', `data-loading-text="${dict['product.adding']}"`);

  // Replace cart error message data-attributes
  translated = translated.replaceAll(
    'data-w-cart-quantity-error="Die angefragte Menge \u00fcberschreitet die Verf\u00fcgbarkeit."',
    `data-w-cart-quantity-error="${dict['cart.generalError']}"`
  );
  translated = translated.replaceAll(
    'data-w-cart-general-error="Ups, irgendwas scheint schiefgelaufen zu sein."',
    `data-w-cart-general-error="${dict['cart.generalError']}"`
  );
  translated = translated.replaceAll(
    'data-w-cart-checkout-error="Checkout ist auf dieser Seite deaktiviert."',
    `data-w-cart-checkout-error="${dict['cart.checkoutDisabled']}"`
  );
  translated = translated.replaceAll(
    'data-w-cart-cart_order_min-error="Mindestbestellwert nicht erreicht. F\u00fcgen Sie weitere Artikel hinzu."',
    `data-w-cart-cart_order_min-error="${dict['cart.minOrderError']}"`
  );
  translated = translated.replaceAll(
    'data-w-cart-subscription_error-error="Bitte best\u00e4tigen Sie vor dem Kauf Ihre Adresse per E-Mail-Einladung f\u00fcr Bestellupdates."',
    `data-w-cart-subscription_error-error="${dict['cart.confirmAddress']}"`
  );
  translated = translated.replaceAll(
    'data-w-cart-quantity-error="Produkt in dieser Menge nicht verf\u00fcgbar."',
    `data-w-cart-quantity-error="${dict['product.notAvailableQty']}"`
  );
  translated = translated.replaceAll(
    'data-w-cart-general-error="Fehler beim Hinzuf\u00fcgen zum Warenkorb."',
    `data-w-cart-general-error="${dict['cart.addError']}"`
  );
  translated = translated.replaceAll(
    'data-w-cart-checkout-error="Bestellabschluss deaktiviert."',
    `data-w-cart-checkout-error="${dict['cart.orderDisabled']}"`
  );

  // Replace checkout button values
  translated = translated.replaceAll('value="Zur Kassa"', `value="${dict['cart.toCheckout']}"`);
  translated = translated.replaceAll('value="Weiter zum Checkout"', `value="${dict['cart.continueToCheckout']}"`);

  // --- EU ODR (Online Dispute Resolution) link — required by EU Regulation 524/2013 ---
  const odrTexts: Record<string, { label: string; linkText: string }> = {
    de: {
      label: 'Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO:',
      linkText: 'OS-Plattform der Europäischen Kommission',
    },
    en: {
      label: 'Online Dispute Resolution pursuant to Art. 14(1) ODR Regulation:',
      linkText: 'EU Online Dispute Resolution Platform',
    },
    es: {
      label: 'Resolución de litigios en línea conforme al Art. 14.1 del Reglamento ODR:',
      linkText: 'Plataforma ODR de la Comisión Europea',
    },
  };
  const odr = odrTexts[locale] || odrTexts.de;
  const odrHtml = `<div style="text-align:center;padding:12px 20px 0;font-size:12px;color:#999;font-family:'Playfair Display',Georgia,serif;">${odr.label} <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style="color:#999;text-decoration:underline;">${odr.linkText}</a></div>`;

  // Inject ODR link before the closing </footer> tag (if present)
  if (translated.includes('</footer>')) {
    translated = translated.replace('</footer>', odrHtml + '</footer>');
  }

  return translated;
}

// Map German slugs to localized slugs for EN/ES
const SLUG_LOCALIZATION: Record<string, Record<string, string>> = {
  'akurock-muster': { en: 'sample-box', es: 'caja-de-muestras' },
  'cart': { en: 'shopping-cart', es: 'carrito' },
  'akustik': { en: 'acoustics', es: 'acustica' },
  'allgemeine-geschaeftsbedingungen': { en: 'terms-and-conditions', es: 'terminos-y-condiciones' },
  'cookie-und-datschenschutzerklaerung': { en: 'privacy-policy', es: 'politica-de-privacidad' },
  'galerie': { en: 'gallery', es: 'galeria' },
  'impressum': { en: 'legal-notice', es: 'aviso-legal' },
  'kontaktier-uns': { en: 'contact-us', es: 'contactenos' },
  'stein-selektion': { en: 'our-stones', es: 'nuestras-piedras' },
  'uber-uns': { en: 'about-us', es: 'sobre-nosotros' },
  'verantwortung': { en: 'responsibility', es: 'responsabilidad' },
  'zahlung-und-versand': { en: 'payment-and-shipping', es: 'pago-y-envio' },
  'zubehoer': { en: 'accessories', es: 'accesorios' },
  'visualizer': { en: 'visualizer', es: 'visualizador' },
  'installation-and-guide': { en: 'installation-and-guide', es: 'guia-de-instalacion' },
  'blog-news': { en: 'blog-news', es: 'blog-noticias' },
  'faq': { en: 'faq', es: 'preguntas-frecuentes' },
  'stoneskin': { en: 'stoneskin', es: 'stoneskin' },
};

function prefixInternalLinks(html: string, locale: Locale): string {
  return html.replace(
    /href="\/([^"]*?)"/g,
    (match, path) => {
      // Don't prefix static asset or admin/api paths
      if (/^(admin|api|images|videos|documents|js|fonts|css|data|_next)/.test(path)) {
        return match;
      }
      // Don't prefix if already has a locale
      if (/^(de|en|es)(\/|$)/.test(path)) {
        return match;
      }
      // For non-DE locales, also localize the slug itself
      if (locale !== 'de') {
        const localizedPath = SLUG_LOCALIZATION[path]?.[locale];
        if (localizedPath) {
          return `href="/${locale}/${localizedPath}"`;
        }
      }
      return `href="/${locale}/${path}"`;
    }
  );
}
