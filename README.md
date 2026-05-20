# stampyApp
A cute app that allows you to take pictures of stamps, collect them, and export them or make a moodboard out of your collection.

The idea came when I encountered a machine that cut stamps from magazines and cardboard, I though it would be perfect on a phone!

**Features :**
- Take photos, and turn them into stamps! Several filters available.
- Track on a calendar your stamp-of-the day
- Sort them by favourites or by tag
- Create a "Stamp flow", where stamps are arranged in a waterfall, perfect for a moodboard!
- Export them, and use them as picture or sticker in conversation!


**To be done :**
- Beautify the UI
- Add more filters
- Book-mode for stamps, to sort them like in a collection book.
- Search mode for a time and date, and more sort options
- Export full page


**Screenshots :**
<img width="250" height="544" alt="IMG_1147" src="https://github.com/user-attachments/assets/7bc6bdf3-7904-4f8a-9358-e068b8f6c754" />
<img width="250" height="544" alt="IMG_1146" src="https://github.com/user-attachments/assets/8364c44c-dd24-4fa6-8e39-8b0f0a942955" />
<img width="250" height="544" alt="IMG_1145" src="https://github.com/user-attachments/assets/8986b608-db65-4ce1-8e19-26a18d14e572" />




**Framework**
Expo SDK 54 (managed workflow)
React Native 0.81.5
TypeScript 5.9

**Navigation**
React Navigation 7 — bottom tabs + native stack

**Camera & Media**
expo-camera — live viewfinder and photo capture
expo-image-manipulator — crop photo to stamp outline after capture
expo-file-system — persist images to permanent device storage
react-native-view-shot — capture rendered stamp (with border) as an image for sharing
expo-sharing — system share sheet

**Graphics**
react-native-svg — perforated stamp borders drawn as SVG paths (general polygon engine supporting square, landscape, portrait, diamond, and triangle shapes)
React Native CSS filter property (RN 0.74+) — B&W and fade filters applied at render time, no native module needed

**Database**
expo-sqlite v16 (synchronous API) — local on-device storage for stamps, categories, calendar entries, and favourites

**Gestures & Animation**
React Native PanResponder — horizontal swipe to cycle camera filters
React Native Animated — shutter press feedback

**Target Platforms**
iOS, Android (and Expo Go for development)


