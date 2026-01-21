"use client";

import { useState } from "react";
import { Layout, Menu, theme, Typography } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: <Link href="/dashboard">Dashboard</Link>,
  },
  {
    key: "/dashboard/posts",
    icon: <FileTextOutlined />,
    label: <Link href="/dashboard/posts">Posts</Link>,
  },
  {
    key: "/dashboard/posts/create",
    icon: <PlusOutlined />,
    label: <Link href="/dashboard/posts/create">Create Post</Link>,
  },
  {
    key: "/dashboard/settings",
    icon: <SettingOutlined />,
    label: <Link href="/dashboard/settings">Settings</Link>,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Determine active menu item
  const getSelectedKey = () => {
    if (pathname === "/dashboard") return "/dashboard";
    if (pathname.startsWith("/dashboard/posts/create")) return "/dashboard/posts/create";
    if (pathname.startsWith("/dashboard/posts")) return "/dashboard/posts";
    if (pathname.startsWith("/dashboard/settings")) return "/dashboard/settings";
    return "/dashboard";
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="p-4 text-center">
          <Title level={4} style={{ color: "white", margin: 0 }}>
            {collapsed ? "LS" : "Land Sales"}
          </Title>
        </div>
        <Menu theme="dark" selectedKeys={[getSelectedKey()]} mode="inline" items={menuItems} />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Land Sales Dashboard
          </Title>
        </Header>
        <Content className="page-container">{children}</Content>
      </Layout>
    </Layout>
  );
}
