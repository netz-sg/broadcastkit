Alles klar\! Das ist ein absolut kritisches Feature. Niemand will jedes Mal IP und Passwort eingeben, wenn er das Tool startet. "Fire and Forget" ist die Devise.

Hier ist der **angepasste, detaillierte Entwicklungsplan**, der den **Auto-Connect** und die **Persistenz (Speichern der Settings)** als Kern-Features in die Architektur integriert.

-----

# 🚀 Projekt-Plan: Lokales OBS Overlay Tool (Electron)

## 1\. Der Erweiterte Tech-Stack (Basics + Storage)

Wir ergänzen den Stack um eine wichtige Komponente für das Speichern:

  * **Core:** **Electron** (Main Process = "Das Gehirn")
  * **UI:** **React + TypeScript + Tailwind CSS**
  * **Animation:** **Framer Motion**
  * **Backend (Internal):** **Express** + **Socket.io** (Verteiler)
  * **OBS Kommunikation:** **obs-websocket-js**
  * **Datenspeicherung:** **electron-store** 🆕
      * *Warum:* Das ist der Standard für Electron. Es speichert eine einfache JSON-Datei auf der Festplatte des Users (AppData). Hier landen IP, Port, Passwort und Default-Werte für deine Overlays.

-----

## 2\. Die Anwendungs-Logik: "Start & Connect"

Hier ist der genaue Ablauf, was passiert, wenn du auf die `.exe` klickst. Das muss im `Main Process` (Backend der App) passieren, damit es zuverlässig läuft.

### A. Der "App Lifecycle" (Ablauf beim Starten)

1.  **App Launch:** Electron startet.
2.  **Config Load:** Der `Main Process` fragt `electron-store`: *"Habe ich gespeicherte OBS-Zugangsdaten?"*
3.  **Auto-Connect Versuch:**
      * **JA (Daten da):** Das Tool versucht sofort im Hintergrund, die Verbindung via `obs-websocket-js` herzustellen.
      * **NEIN (Erster Start):** Das Tool öffnet sich und zeigt direkt den Tab "Einstellungen" mit roten Warnhinweis "Nicht verbunden".
4.  **Feedback:** Sobald die Verbindung steht (oder fehlschlägt), sendet der `Main Process` ein Event an das Frontend (React), damit die Status-Lampe von Rot auf Grün springt.

### B. Das Settings-Management

Wir brauchen einen globalen Store, damit du nicht nur Verbindungsdaten, sondern auch Overlay-Zustände speichern kannst (z.B. "Letzter Name in der Bauchbinde").

  * **Datei:** `config.json` (wird automatisch von `electron-store` verwaltet).
  * **Struktur:**
    ```json
    {
      "obs": {
        "address": "ws://127.0.0.1:4455",
        "password": "super-secret-password",
        "autoConnect": true
      },
      "overlays": {
        "lowerThird": {
          "lastUsedName": "Max Mustermann",
          "theme": "Neon-Blue"
        }
      }
    }
    ```

-----

## 3\. Architektur der Komponenten (Skalierbar)

Wir trennen strikt zwischen **Steuerung (Dock)** und **Anzeige (Browser Source)**.

### Ordner-Struktur (Verfeinert)

```text
/src
  /main
     index.ts        <-- App Start & Fenster Management
     store.ts        <-- Konfiguration laden/speichern (electron-store)
     obsHandler.ts   <-- Die WEBSOCKET LOGIK (Auto-Connect hier!)
     server.ts       <-- Express Server & Socket.io
  /renderer (React)
     /src
        /components  <-- UI Bausteine (Inputs, Toggles)
        /pages
           /Dashboard    <-- Die Hauptsteuerung
           /Settings     <-- Formular für OBS IP/PW
        /overlays
           /LowerThird   <-- Die eigentliche Source
```

-----

## 4\. Umsetzung: Die erste Komponente (Lower Third)

So bauen wir das Lower Third, damit es sofort einsatzbereit ist.

### Schritt 1: Das Backend (ObsHandler)

  * Erstelle eine Klasse `ObsConnector`.
  * Im Konstruktor: Lade Daten aus `store`.
  * Methode `connect()`: Versucht Verbindung. Bei Erfolg -\> `socket.emit('OBS_STATUS', 'connected')`.
  * Methode `saveSettings(data)`: Speichert neue Inputs in `store` und reconnectet sofort.

### Schritt 2: Das Dock (Frontend UI)

Das Dock hat zwei Aufgaben: Settings und Steuerung.

  * **Status Bar:** Oben rechts immer sichtbar. Kleiner Punkt (Grün/Rot).
  * **Input Felder:** "Name" und "Titel".
      * *Feature:* Beim Starten werden diese Felder mit den Daten aus `electron-store` vorausgefüllt (Last Used).
  * **Trigger Button:** "Show". Sendet Signal an internen Express Server.

### Schritt 3: Die Browser Source (Overlay)

  * Hört auf `socket.on('SHOW_LOWER_THIRD')`.
  * Nutzt **Framer Motion** für die Animation.
  * *Design:* Wir nutzen CSS Variablen oder Tailwind Klassen, die wir über das Dock später ändern können (z.B. Farbe ändern, ohne den Code anzufassen).

-----

## 5\. Roadmap zur Erweiterung (Future Proofing)

Damit du später nicht alles neu schreiben musst:

1.  **Event Bus System:**
    Wir einigen uns auf ein Standard-Format für Socket-Nachrichten:
    `{ action: 'SHOW', module: 'LOWER_THIRD', payload: { ... } }`
    So kann jedes neue Modul (z.B. Chat, Alerts) einfach auf seinen `module`-Namen hören.

2.  **Dynamic Routing:**
    Der Express Server scannt automatisch den Ordner `/overlays`. Wenn du einen neuen Ordner `/overlays/KillCounter` anlegst, ist dieser automatisch unter `localhost:3000/KillCounter` erreichbar. Kein manuelles Routing nötig\!

-----

**Zusammenfassung für den Start:**
Dein erstes Ziel ist ein "Hello World", bei dem du die App öffnest, der grüne Punkt für "OBS Connected" angeht (weil es lokal gespeicherte Daten nutzt) und du per Knopfdruck ein Rechteck in OBS ein- und ausblenden kannst.

Soll ich dir den Code für die **`store.ts`** und den **Auto-Connect im Main-Process** generieren? Das ist der kniffligste Teil am Anfang.