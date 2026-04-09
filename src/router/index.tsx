import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { App } from "@/router/App"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    // 未来可扩展子路由：
    // children: [
    //   { path: "report/:tsCode?", element: <ReportPage /> },
    //   { path: "settings", element: <SettingsPage /> },
    // ]
  },
])

export { RouterProvider }
