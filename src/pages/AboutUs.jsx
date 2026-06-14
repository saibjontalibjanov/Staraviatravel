import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPlane,
  faCheckCircle,
  faGlobe,
  faThumbsUp,
  faStar,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import BgImage from "../../addes/picture/bg-img.jpg";
import TopBar from "../components/TopBar";
import Staravia from "../../pictures/icons/staravia-logo-2.png"
import Business from "../../pictures/seats/business-seat.jpg"
import Premium from "../../pictures/seats/premiumeco-seat.jpg"
import Economy from "../../pictures/seats/economy-seat.jpg"
import First from "../../pictures/seats/firstclass-seat.jpg"

export default function AboutUs() {
  return (
    <>
        <TopBar />
        <section className="relative overflow-hidden py-24">
        {/* Background */}
        <div className="absolute inset-0">
            <img
            src={BgImage}
            alt=""
            className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
            {/* Top Label */}
            <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-20 h-px bg-[#C8A45D]"></div>

            <div className="flex flex-col items-center">
                <img src={Staravia} className="w-24 mb-3" alt="" />

                <span className="tracking-[6px] text-[#C8A45D] text-sm uppercase">
                Staravia Travel
                </span>
            </div>

            <div className="w-20 h-px bg-[#C8A45D]"></div>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-[320px_1fr_320px] gap-10 items-center">
            {/* LEFT */}
            <div className="relative hidden lg:block h-[650px]">
                <div className="absolute top-0 left-0">
                <img
                    src={Business}
                    className="w-[300px] h-[460px] object-cover border border-[#D4AF37]"
                    alt="Team member"
                />
                </div>

                <div className="absolute bottom-0 left-10">
                <img
                    src={Economy}
                    className="w-[220px] h-[220px] object-cover border border-[#D4AF37]"
                    alt="Team member"
                />
                </div>
            </div>

            {/* CENTER */}
            <div className="text-center">
                <h2 className="font-serif text-6xl md:text-7xl mb-8 leading-tight">
                <span className="text-[#C8A45D]">StarAvia </span>
                <br />
                <span className="text-[#0D2240]">Travel</span>
                </h2>

                <div className="flex items-center justify-center gap-4 mb-10">
                <div className="w-20 h-px bg-[#C8A45D]"></div>
                <FontAwesomeIcon icon={faStar} className="text-[#C8A45D] text-xl" />
                <div className="w-20 h-px bg-[#C8A45D]"></div>
                </div>

                <p className="max-w-3xl mx-auto text-gray-800 text-lg leading-10">
                StarAviaTravel is an official airline retailer since 2014, offering
                personalized one-on-one service and exclusive deals on business and
                first-class flights. With privately negotiated rates from over 70
                major carriers, our dedicated Personal Travel Agents ensure tailored
                itineraries to meet individual preferences.
                </p>

                <p className="max-w-3xl mx-auto text-gray-800 text-lg leading-10 mt-6">
                Unlike online platforms, we prioritize direct interaction with live
                experts, boasting years of industry experience. Benefit from our
                access to privately negotiated fares, major airline relationships,
                and consistent client praise for our personalized service.
                </p>
            </div>

            {/* RIGHT */}
            <div className="relative hidden lg:block h-[650px]">
                <div className="absolute top-10 right-0">
                <img
                    src={First}
                    className="w-[300px] h-[360px] object-cover border border-[#D4AF37]"
                    alt="Team member"
                />
                </div>

                <div className="absolute bottom-0 right-10">
                <img
                    src={Premium}
                    className="w-[220px] h-[220px] object-cover border border-[#D4AF37]"
                    alt="Team member"
                />
                </div>
            </div>
            </div>

            {/* Airplane */}
            <div className="absolute top-20 right-32 hidden xl:block">
              
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mt-24">
            <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#C8A45D] flex items-center justify-center mx-auto mb-5">
                  <FontAwesomeIcon icon={faUser} className="text-2xl text-[#C8A45D]" />
                </div>
                <h3 className="font-semibold text-[#0D2240] text-xl mb-3">
                Personalized Service
                </h3>
                <p className="text-gray-700 leading-8">
                One-on-one support from dedicated travel experts.
                </p>
            </div>

            <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#C8A45D] flex items-center justify-center mx-auto mb-5">
                  <FontAwesomeIcon icon={faPlane} className="text-2xl text-[#C8A45D]" />
                </div>
                <h3 className="font-semibold text-[#0D2240] text-xl mb-3">
                Exclusive Deals
                </h3>
                <p className="text-gray-700 leading-8">
                Privately negotiated business and first-class fares.
                </p>
            </div>

            <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#C8A45D] flex items-center justify-center mx-auto mb-5">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-[#C8A45D]" />
                </div>
                <h3 className="font-semibold text-[#0D2240] text-xl mb-3">
                Trusted Experience
                </h3>
                <p className="text-gray-700 leading-8">
                Proven expertise and customer satisfaction.
                </p>
            </div>

            <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#C8A45D] flex items-center justify-center mx-auto mb-5">
                  <FontAwesomeIcon icon={faGlobe} className="text-2xl text-[#C8A45D]" />
                </div>
                <h3 className="font-semibold text-[#0D2240] text-xl mb-3">
                Global Connections
                </h3>
                <p className="text-gray-700 leading-8">
                Strong airline partnerships worldwide.
                </p>
            </div>

            <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#C8A45D] flex items-center justify-center mx-auto mb-5">
                  <FontAwesomeIcon icon={faThumbsUp} className="text-2xl text-[#C8A45D]" />
                </div>
                <h3 className="font-semibold text-[#0D2240] text-xl mb-3">
                Client Praise
                </h3>
                <p className="text-gray-700 leading-8">
                Consistently rated highly by travelers.
                </p>
            </div>
            </div>
        </div>
        </section>
    </>
  );
}
