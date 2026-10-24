import { useLanguage } from '../i18n/LanguageContext'
import MainNavbar from './MainNavbar'
import SearchForm from './SearchForm'

const Hero = () => {
  const { t } = useLanguage()


  return (
    <div className="relative min-h-screen w-full flex flex-col bg-ink">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/Cover800x312_darken_3mb.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 mx-auto w-full max-w-[1500px] flex-1 flex flex-col">
        <MainNavbar />

        {/* HERO CONTENT */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 pt-6 md:px-12 lg:px-8 text-center">
          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight max-w-3xl"> {t("Business & First Class")} <span className="text-gold">{t("Tickets")}</span>
          </h1>

          {/* Alliance logos row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {/* Star Alliance */}
            <div className="flex items-center gap-2.5">
              <img src="/pictures/star-alliance.png" alt="Star Alliance" className="w-8 h-8" />
              <div className="text-left">
                <div className="text-white font-bold text-sm tracking-wide leading-none">{t("STAR ALLIANCE")}</div>
                <div className="text-white/50 text-[10px] mt-0.5">{t("28 airlines")}</div>
              </div>
            </div>

            <div className="w-px h-10 bg-white/20 hidden sm:block"></div>

            {/* SkyTeam */}
            <div className="flex items-center gap-2.5">
              <img src="/pictures/skyteam.png" alt="SkyTeam" className="w-8 h-8" />
              <div className="text-left">
                <div className="text-white font-bold text-sm tracking-wide leading-none">{t("SKYTEAM")}</div>
                <div className="text-white/50 text-[10px] mt-0.5">{t("19 airlines")}</div>
              </div>
            </div>

            <div className="w-px h-10 bg-white/20 hidden sm:block"></div>

            {/* Oneworld */}
            <div className="flex items-center gap-2.5">
              <img src="/pictures/oneworld.png" alt="Oneworld" className="w-25 h-8" />
              <div className="text-left">
                <div className="text-white font-bold text-sm tracking-wide leading-none">{t("ONEWORLD")}</div>
                <div className="text-white/50 text-[10px] mt-0.5">{t("13 airlines")}</div>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <SearchForm />

          {/* Savings tagline */}
          <p className="mt-6 text-gold-soft italic text-sm md:text-base font-medium"> {t("\"Start your journey with")} <span className="font-bold text-gold not-italic">{t("Staravia")}</span>"
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-14">
            <div className="flex flex-col items-center text-center">
              <div className="text-white font-black text-2xl leading-none font-display">{t("TAC")}</div>
              <div className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">{t("Travel Assistance Company")}</div>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
            <div className="flex flex-col items-center text-center">
              <div className="text-white font-black text-2xl leading-none font-display">24·7</div>
              <div className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">{t("Live Concierge")}</div>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
            <div className="flex flex-col items-center text-center">
              <div className="text-white font-black text-2xl leading-none font-display">200+</div>
              <div className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">{t("Airlines")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
