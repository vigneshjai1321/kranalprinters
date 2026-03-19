import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@ant-design/v5-patch-for-react-19";
import { App as AntApp, ConfigProvider } from "antd";
import "antd/dist/reset.css";
import "./styles.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "\"Manrope\", \"Segoe UI\", sans-serif",
          colorPrimary: "#1165d9",
          colorInfo: "#1165d9",
          colorLink: "#0a4eb0",
          colorSuccess: "#1fa971",
          colorWarning: "#f08b2f",
          colorError: "#dc4a4a",
          colorBgLayout: "#f1f7ff",
          colorBgContainer: "#ffffff",
          colorBorder: "#d4e4ff",
          borderRadius: 12,
          borderRadiusLG: 16,
        },
        components: {
          Button: {
            controlHeight: 40,
            fontWeight: 600,
            borderRadius: 12,
          },
          Card: {
            borderRadiusLG: 14,
            headerFontSize: 16,
          },
          Menu: {
            itemBorderRadius: 12,
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
