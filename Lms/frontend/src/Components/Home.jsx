import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import img1 from "../assets/img1.jpg";
import img2 from "../assets/img2.jpg";
import img3 from "../assets/img3.jpg";

const Home = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Carousel */}
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 3000 }}
        loop={true}
        className=" h-full w-full"
      >
        <SwiperSlide>
          <img
            src={img1}
            alt=""
            className="w-full h-full object-cover"
          />
        </SwiperSlide>

        <SwiperSlide>
          <img
            src={img2}
            alt=""
            className="w-full h-screen object-cover"
          />
        </SwiperSlide>

        <SwiperSlide>
          <img
            src={img3}
            alt=""
            className="w-full h-screen object-cover"
          />
        </SwiperSlide>
      </Swiper>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 z-10"></div>

      {/* Text Content */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <h1 className="text-center text-5xl font-bold text-white">
          Your One Stop Learning Solution.
        </h1>
      </div>
    </div>
  );
};
export default Home