import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShirt, faHourglass } from "@fortawesome/free-solid-svg-icons";
import { ReactComponent as Truck } from "../icons/truck.svg";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const FEATURES = [
  {
    icon: <Truck style={{ width: 32, height: 32 }} />,
    label: "7-Day Return Policy",
    desc: "Enjoy worry-free shopping with our 7-day return policy. If you're not satisfied, return your product within 7 days for a hassle-free refund or exchange.",
  },
  {
    icon: <FontAwesomeIcon icon={faShirt} size="2x" />,
    label: "100% Cotton Fabric",
    desc: "Experience comfort and quality with our 100% cotton premium fabric, ensuring breathability and durability for everyday wear.",
  },
  {
    icon: <FontAwesomeIcon icon={faHourglass} size="2x" />,
    label: "Limited Drops Only",
    desc: "Shop exclusive, limited edition collections. Our drops are uniquely crafted and available only for a short time – don’t miss out!",
  },
];

export default function ConfidenceBar() {
  return (
    <section
      style={{
        background: "#f5f5f5",
        padding: "5px 0",
        margin: "4px 0",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 1.5rem",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontWeight: 100,
            letterSpacing: "0.04em",
            fontSize: "clamp(1.1rem, 2vw, 2rem)",
          }}
        >
          SHOP WITH CONFIDENCE
        </h2>
        {/* Desktop: 3 columns */}
        <div className="d-none d-md-flex flex-row justify-content-between align-items-stretch gap-4">
          {FEATURES.map((item, idx) => (
            <motion.div
              key={item.label}
              className="flex-fill text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background: "#f5f5f5",
                borderRadius: 10,
                padding: "16px 16px",
                minWidth: 200,
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              <div>{item.icon}</div>
              <h3
                style={{
                  fontWeight: 600,
                  margin: "16px 0 8px",
                  fontSize: "1.1rem",
                  letterSpacing: "0.05em",
                }}
              >
                {item.label}
              </h3>
              <p
                style={{
                  color: "#444",
                  fontSize: "1rem",
                  lineHeight: 1.6,
                }}
              >
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
        {/* Mobile: Carousel */}
        <div className="d-block d-md-none">
          <Swiper
            navigation={false}
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            pagination={false}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            style={{ paddingBottom: 32 }}
          >
            {FEATURES.map((item, idx) => (
              <SwiperSlide key={item.label}>
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    background: "#f5f5f5",
                    borderRadius: 10,
                    padding: "32px 16px",
                    minWidth: 200,
                    maxWidth: 400,
                    margin: "0 auto",
                  }}
                >
                  <div>{item.icon}</div>
                  <h3
                    style={{
                      fontWeight: 600,
                      margin: "16px 0 8px",
                      fontSize: "1.1rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {item.label}
                  </h3>
                  <p
                    style={{
                      color: "#444",
                      fontSize: "1rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
