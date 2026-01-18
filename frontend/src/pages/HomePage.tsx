import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { getCardImage } from "@/hooks/game/useCardImages";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import Footer from "@/components/Footer";
import mosquito from "@/assets/gifs/mosquito.gif";
import "swiper/swiper-bundle.css";
import "@/css/HomePage.css";
import "@/css/Footer.css";

const HomePage: React.FC = () => {
  const t = useLanguageStore((state) => state.t);

  const cardColors = [
    "blue",
    "yellow",
    "red",
    "orange",
    "purple",
    "green",
    "brown",
  ];

  return (
    <main className="home-page" role="main" aria-label={t("home.ariaLabel")}>
      <section id="intro" aria-labelledby="hero-title">
        <div className="text-and-slider">
          <div className="mosquito-container">
            <img
              src={mosquito}
              alt={t("home.mosquitoAlt")}
              className="mosquito-gif"
            />
          </div>

          <header className="hero-header">
            <h1 id="hero-title" className="glow">
              {t("home.welcome")}
            </h1>
            <h2 className="hero-subtitle">{t("home.subtitle")}</h2>
          </header>

          <div className="text-container">
            <p className="description">{t("home.description")}</p>
          </div>

          <div className="slider-container" aria-label={t("home.sliderLabel")}>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={15}
              slidesPerView={3}
              centeredSlides={true}
              loop={false}
              grabCursor={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              navigation
              initialSlide={0}
              className="card-slider"
              breakpoints={{
                320: {
                  slidesPerView: 1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 30,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 40,
                },
              }}
            >
              {cardColors.map((color, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={getCardImage(color)}
                    alt={t(`home.cards.${color}`)}
                    className="chameleon-card"
                    loading="lazy"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default HomePage;
