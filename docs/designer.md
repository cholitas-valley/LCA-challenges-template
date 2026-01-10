# Designer Space

The Designer Space provides a visual floor plan view where you can arrange your plants spatially and see their real-time status at a glance.

## Overview

The Designer uses a "clean technical" aesthetic with top-down plant icons. Each plant shows:
- A line-art icon based on species
- A status indicator (green/yellow/red/gray dot)
- The plant name

## Accessing the Designer

Navigate to `/designer` or click "Designer" in the main navigation.

## View Mode

In View Mode (default):
- See all your plants arranged on the canvas
- Hover over plants to see sensor readings
- Click a plant to go to its detail page

## Edit Mode

Switch to Edit Mode to rearrange plants:
1. Click the "Edit" button in the toolbar
2. Drag plants to reposition them
3. Drag plants from the sidebar to place them
4. Switch back to "View" when done

Positions are saved automatically.

## Sidebar

The sidebar shows plants that haven't been placed on the canvas yet. In Edit Mode, drag them onto the canvas to position them.

## Status Indicators

Each plant has a status dot:
- **Green**: Online, readings within thresholds
- **Yellow**: Warning, some readings outside optimal range
- **Red**: Critical, readings significantly outside thresholds
- **Gray**: Offline, no recent sensor data

## Tooltips

Hover over any plant to see current readings:
- Soil moisture (%)
- Temperature (C)
- Humidity (%)
- Light level (lux)
- Last updated timestamp

## Touch Support

On tablets and touch devices:
- Tap and hold to drag plants (Edit Mode)
- Tap a plant to see tooltip
- Tap again to navigate to details

## Keyboard Navigation

- Tab: Move focus between plants
- Enter: Navigate to focused plant's detail page
- Arrow keys: Move focused plant (Edit Mode)
