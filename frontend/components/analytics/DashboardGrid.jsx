"use client";

/**
 * DashboardGrid — wrapper for react-grid-layout v2+
 *
 * react-grid-layout v2 removed WidthProvider. ResponsiveGridLayout now
 * measures its container width automatically. Just re-export it.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ResponsiveGridLayout } = require("react-grid-layout");
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default ResponsiveGridLayout;
