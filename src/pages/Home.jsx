import {
  AppstoreOutlined,
  EnvironmentFilled,
  ClockCircleOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  PhoneFilled,
  PushpinOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
  ShopOutlined,
  StarFilled,
  TeamOutlined,
} from "@ant-design/icons";
import { App, Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    title: "Prime Location",
    description: "Positioned in the heart of Chennai for easy access",
    icon: <EnvironmentOutlined className="feature-icon" />,
  },
  {
    title: "Customer-Centric Approach",
    description: "Friendly and knowledgeable staff support",
    icon: <TeamOutlined className="feature-icon" />,
  },
  {
    title: "Quality Printing",
    description: "High precision pharma packaging solutions",
    icon: <SafetyCertificateOutlined className="feature-icon" />,
  },
  {
    title: "Fast Delivery",
    description: "Timely production and delivery",
    icon: <RocketOutlined className="feature-icon" />,
  },
  {
    title: "Flexible Orders",
    description: "Custom sizes, designs, and bulk orders",
    icon: <ShopOutlined className="feature-icon" />,
  },
  {
    title: "Exclusive Deals",
    description: "Offers and discounts available (confirm directly)",
    icon: <GiftOutlined className="feature-icon" />,
  },
];

const services = [
  { title: "Medicine Box Printing", icon: <AppstoreOutlined className="service-icon" /> },
  { title: "Label Printing", icon: <Tag className="service-tag-icon">LBL</Tag> },
  { title: "Pharma Packaging", icon: <SafetyCertificateOutlined className="service-icon" /> },
  { title: "Custom Carton Design", icon: <ShopOutlined className="service-icon" /> },
];

const processVisuals = [
  {
    title: "Printing Process",
    caption: "Prepress to final print quality checks",
    image: "/images/printingprocess.jpg",
  },
  {
    title: "Packaging Boxes",
    caption: "Durable, brand-aligned medicine box solutions",
    image: "/images/packagingbox.jpg",
  },
  {
    title: "Pharma Cartons",
    caption: "Compliance-focused carton finishing and packing",
    image: "/images/pharmacartons.jpg",
  },
];

const weeklyHours = [
  ["Wednesday", "9:30 am - 8:30 pm"],
  ["Thursday", "9:30 am - 8:30 pm"],
  ["Friday", "9:30 am - 8:30 pm"],
  ["Saturday", "9:30 am - 8:30 pm"],
  ["Sunday", "Closed"],
  ["Monday", "9:30 am - 8:30 pm"],
  ["Tuesday", "9:30 am - 8:30 pm"],
];

export default function Home() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const businessPhone = "04443858100";
  const businessAddress = "34, Alagiri Nagar Main Rd, Vadapalani, Chennai, Tamil Nadu 600026";
  const mapsQuery = encodeURIComponent(businessAddress);

  const scrollToServices = () => {
    const section = document.getElementById("services");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openDirections = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`, "_blank", "noopener,noreferrer");
  };

  const callBusiness = () => {
    window.location.href = `tel:${businessPhone}`;
  };

  const shareBusiness = async () => {
    const shareText = `Kranal Prints - ${businessAddress} | Phone: 044 4385 8100`;
    const shareUrl = "https://www.google.com/maps/search/?api=1&query=" + mapsQuery;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Kranal Prints",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User may cancel share action; keep UX quiet.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      message.success("Business details copied");
    } catch {
      message.info("Sharing is not available in this browser");
    }
  };

  const saveBusiness = async () => {
    const saveText = `Kranal Prints\n${businessAddress}\nPhone: 044 4385 8100`;
    try {
      await navigator.clipboard.writeText(saveText);
      message.success("Saved to clipboard");
    } catch {
      message.error("Could not save details");
    }
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-glow" />
        <Space direction="vertical" size={16} className="hero-content">
          <Tag color="blue" className="hero-tag">Pharma Packaging Specialists</Tag>
          <Title level={1} className="hero-title">Kranal Prints</Title>
          <Title level={3} className="hero-subtitle">Pharma Packaging & Printing Experts</Title>
          <Space wrap size={[8, 8]}>
            <Tag color="gold" className="rating-badge"><StarFilled /> 4.5</Tag>
            <Tag className="review-badge">19 Google reviews</Tag>
            <Tag className="location-badge">Print shop in Chennai, Tamil Nadu</Tag>
          </Space>
          <Paragraph className="hero-description">
            We specialize in high-quality medicine box printing, label printing, and packaging solutions
            with precision and speed.
          </Paragraph>
          <Space wrap>
            <Button type="primary" size="large" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
            <Button size="large" onClick={scrollToServices}>
              View Services
            </Button>
          </Space>
        </Space>
      </section>

      <section className="section-gap">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card className="premium-card">
              <Title level={4}>Kranal Prints</Title>
              <Paragraph>
                34, Alagiri Nagar Main Road, Vadapalani<br />
                Chennai - 600026 (Tamil Nadu), India
              </Paragraph>
              <Space direction="vertical" size={6}>
                <Text><strong>Phone:</strong> 044 4385 8100</Text>
                <Text><strong>Address:</strong> 34, Alagiri Nagar Main Rd, Vadapalani, Chennai, Tamil Nadu 600026</Text>
                <Text><strong>Category:</strong> Print shop in Chennai, Tamil Nadu</Text>
              </Space>
              <div className="location-action-row">
                <Button icon={<EnvironmentFilled />} onClick={openDirections}>Directions</Button>
                <Button icon={<PhoneFilled />} onClick={callBusiness}>Call</Button>
                <Button icon={<ShareAltOutlined />} onClick={shareBusiness}>Share</Button>
                <Button icon={<PushpinOutlined />} onClick={saveBusiness}>Save</Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card className="premium-card info-card-gradient">
              <Space direction="vertical" size={12}>
                <Text className="info-highlight"><ClockCircleOutlined /> Reliable Timings</Text>
                <Paragraph>
                  We support pharma businesses with dependable print cycles, transparent communication,
                  and practical execution from concept to delivery.
                </Paragraph>
                <Button type="default" onClick={() => navigate("/jobs")}>Explore Job Dockets</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="section-gap">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card className="premium-card hours-card">
              <Title level={4}>Business Hours</Title>
              <div className="hours-grid">
                {weeklyHours.map(([day, time]) => (
                  <div className="hours-row" key={day}>
                    <Text strong>{day}</Text>
                    <Text type={time === "Closed" ? "danger" : undefined}>{time}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card className="premium-card review-card">
              <Space direction="vertical" size={8}>
                <Text className="info-highlight"><StarFilled /> Trusted by Local Businesses</Text>
                <Title level={3} style={{ margin: 0 }}>4.5 / 5 Rating</Title>
                <Text type="secondary">Based on public Google reviews (19 reviews).</Text>
                <Paragraph style={{ marginBottom: 0 }}>
                  Known for fast response, neat finishing, and reliable print quality for pharma packaging and label jobs.
                </Paragraph>
              </Space>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="section-gap">
        <Title level={3}>Why Choose Us</Title>
        <Row gutter={[16, 16]}>
          {features.map((feature) => (
            <Col xs={24} sm={12} lg={8} key={feature.title}>
              <Card className="feature-card" hoverable>
                <Space direction="vertical" size={10}>
                  {feature.icon}
                  <Text strong>{feature.title}</Text>
                  <Text type="secondary">{feature.description}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section id="services" className="section-gap">
        <Title level={3}>Services</Title>
        <Row gutter={[16, 16]}>
          {services.map((service) => (
            <Col xs={24} sm={12} lg={6} key={service.title}>
              <Card className="service-card" hoverable>
                <Space direction="vertical" size={12}>
                  {service.icon}
                  <Text strong>{service.title}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="section-gap">
        <Title level={3}>Our Visual Workflow</Title>
        <Row gutter={[16, 16]}>
          {processVisuals.map((item) => (
            <Col xs={24} md={8} key={item.title}>
              <Card className="visual-card" hoverable>
                <div className="visual-image-wrap">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="visual-image"
                    loading="lazy"
                  />
                </div>
                <Title level={5} style={{ marginTop: 12 }}>{item.title}</Title>
                <Text type="secondary">{item.caption}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="section-gap">
        <Card className="cta-card">
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Title level={3} style={{ marginBottom: 4 }}>Manage Your Jobs Digitally</Title>
              <Text>Track, prioritize, and execute every print job with a modern docket workflow.</Text>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "right" }}>
              <Button type="primary" size="large" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </Col>
          </Row>
        </Card>
      </section>
    </div>
  );
}
