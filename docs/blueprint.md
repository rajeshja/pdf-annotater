# **App Name**: PanelFlow

## Core Features:

- PDF Upload and Display: User can upload a PDF, which will be displayed in the browser.
- Page Navigation: User can view a preview of all pages, and switch between them
- Automatic Panel Detection: Use opencv.js to analyze pages and detect the location of panels. The panel detection algorithm needs to decide when panels are considered 'valid'. This algorithm acts as a tool.
- Panel Editing: Allow users to edit panel annotations: move, resize, and delete existing blocks
- Panel Creation: Allow users to manually create panel annotations to outline blocks. Create a new panel with a drag action, which defines its coordinates.
- Undo/Redo Functionality: User can undo and redo annotation changes.
- Export to .cbz: User can export the annotated pages as a .cbz file (Comic Book Zip).

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) evoking creativity and technology, for a modern and engaging feel. 
- Background color: Light, desaturated blue (#E5F6FD), providing a calming backdrop that doesn't distract from the comic content.
- Accent color: A contrasting yellow (#F9A825) used sparingly for interactive elements to draw attention and signal interactivity.
- Font: 'Inter', a sans-serif font, provides a clean and modern look for both headings and body text.
- Simple, outlined icons for actions (e.g., upload, edit, export) maintaining a minimalist aesthetic.
- A clean and intuitive layout with the PDF display as the central focus, surrounded by unobtrusive editing tools.
- Subtle animations and transitions when opening files or adjusting blocks.