"use client";

import { Card, Form, Input, Button, Divider, Alert, Space, Typography } from "antd";
import { SaveOutlined, LinkOutlined } from "@ant-design/icons";

const { Text, Link } = Typography;

export default function SettingsPage() {
  const [form] = Form.useForm();

  return (
    <div className="max-w-3xl mx-auto">
      <Card title="Settings">
        <Alert
          message="Configuration Required"
          description="Please configure your API keys in the .env.local file. These settings are for reference only."
          type="info"
          showIcon
          className="mb-6"
        />

        <Form form={form} layout="vertical">
          {/* Supabase */}
          <Divider orientation="left">Supabase Configuration</Divider>
          <Text type="secondary" className="block mb-4">
            Get your keys from{" "}
            <Link href="https://supabase.com/dashboard" target="_blank">
              Supabase Dashboard <LinkOutlined />
            </Link>
          </Text>

          <Form.Item label="Supabase URL">
            <Input
              placeholder="https://your-project.supabase.co"
              disabled
              value={process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured"}
            />
          </Form.Item>

          <Form.Item label="Supabase Anon Key">
            <Input.Password
              placeholder="Your anon key"
              disabled
              value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "••••••••" : "Not configured"}
            />
          </Form.Item>

          {/* Facebook */}
          <Divider orientation="left">Facebook/Meta Configuration</Divider>
          <Text type="secondary" className="block mb-4">
            Get your app credentials from{" "}
            <Link href="https://developers.facebook.com/apps" target="_blank">
              Facebook Developers <LinkOutlined />
            </Link>
          </Text>

          <Form.Item label="Facebook App ID">
            <Input
              placeholder="Your Facebook App ID"
              disabled
              value={process.env.FB_APP_ID || "Not configured"}
            />
          </Form.Item>

          <Form.Item label="Facebook App Secret">
            <Input.Password
              placeholder="Your Facebook App Secret"
              disabled
              value={process.env.FB_APP_SECRET ? "••••••••" : "Not configured"}
            />
          </Form.Item>

          {/* n8n */}
          <Divider orientation="left">n8n Configuration</Divider>
          <Text type="secondary" className="block mb-4">
            Configure your n8n webhook URL for AI automation workflows.
          </Text>

          <Form.Item label="n8n Webhook URL">
            <Input
              placeholder="https://your-n8n.com/webhook/xxx"
              disabled
              value={process.env.N8N_WEBHOOK_URL || "Not configured"}
            />
          </Form.Item>

          {/* AI Services */}
          <Divider orientation="left">AI Services</Divider>
          <Text type="secondary" className="block mb-4">
            Get your Gemini API key from{" "}
            <Link href="https://makersuite.google.com/app/apikey" target="_blank">
              Google AI Studio <LinkOutlined />
            </Link>
          </Text>

          <Form.Item label="Gemini API Key">
            <Input.Password
              placeholder="Your Gemini API Key"
              disabled
              value={process.env.GEMINI_API_KEY ? "••••••••" : "Not configured"}
            />
          </Form.Item>

          <Form.Item label="Veo3 API Key">
            <Input.Password
              placeholder="Your Veo3 API Key"
              disabled
              value={process.env.VEO3_API_KEY ? "••••••••" : "Not configured"}
            />
          </Form.Item>

          <Divider />

          <Alert
            message="Environment Variables"
            description={
              <div>
                <p>To configure these settings, create a <code>.env.local</code> file in the project root with the following variables:</p>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
FB_APP_ID=
FB_APP_SECRET=
N8N_WEBHOOK_URL=
N8N_API_KEY=
GEMINI_API_KEY=
VEO3_API_KEY=`}
                </pre>
              </div>
            }
            type="warning"
            showIcon
          />

          <Form.Item className="mt-4 mb-0">
            <Space>
              <Button type="primary" icon={<SaveOutlined />} disabled>
                Save Settings
              </Button>
              <Text type="secondary">(Settings are managed via environment variables)</Text>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
