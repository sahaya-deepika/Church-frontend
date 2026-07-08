"use client";
import PriestAvailabilitySection from "@/components/pages_components/PriestAvailabilitySection";
import HeroSection from "@/components/pages_components/HeroSection";
import { Droplets, ArrowRight, ClipboardList, Cross, PersonStandingIcon, User2, HandshakeIcon, BookPlusIcon, MapPinPlusInside, UserRoundPlusIcon, BriefcaseMedicalIcon } from "lucide-react";
import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useState } from "react";
import { toast } from "sonner";
import LoginSignupModal from "@/components/common_components/LoginSignupModal";
import { useRouter } from "next/navigation";

export default function PublicHomePage() {

  const { user } = useAuthUser();
  const [loginSignupModalOpen, setLoginSignupModalOpen] = useState(false);
  const [applicationType, setApplicationType] = useState(null);
  const router = useRouter();

  const handleBaptismAction = (actionObjective = "apply") => {
    setApplicationType("baptism");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/baptism_request/apply") : router.push("/applications/baptism_request/edit");
  }

  const handleEucharistAction = (actionObjective = "apply") => {
    setApplicationType("eucharist");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/eucharist_request/apply") : router.push("/applications/eucharist_request/edit");
  }

  const handleConfessionAction = (actionObjective = "apply") => {
    setApplicationType("confession");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/confession_request/apply") : router.push("/applications/confession_request/edit");
  }

  const handleConfirmationAction = (actionObjective = "apply") => {
    setApplicationType("confirmation");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/confirmation_request/apply") : router.push("/applications/confirmation_request/edit");
  }

  const handleMeetingAction = (actionObjective = "apply") => {
    setApplicationType("meeting");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/meeting_request/apply") : router.push("/applications/meeting_request/edit");
  }

  const handleMassPrayerAction = (actionObjective = "apply") => {
    setApplicationType("massPrayer");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/mass_prayer/apply") : router.push("/applications/mass_prayer/edit");
  }

  const handleMarriageAction = (actionObjective = "apply") => {
    setApplicationType("marriage");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/marriage_request/apply") : router.push("/applications/marriage_request/edit");
  }

  const handleAnointingOfTheSickAction = (actionObjective = "apply") => {
    setApplicationType("anointingOfTheSick");
    if (!user) {
      toast.info("Please login to continue");
      setLoginSignupModalOpen(true);
      return;
    }
    actionObjective === "apply" ? router.push("/applications/anointing_of_the_sick_request/apply") : router.push("/applications/anointing_of_the_sick_request/edit");
  }

  const applications = [
    { id: 1, title: "Baptism", description: "Register your child for the sacrament of baptism. Our priest will confirm the scheduled date.", Icon: Droplets, handleActionFunction: handleBaptismAction },
    { id: 2, title: "Eucharist", description: "Register for the sacrament of baptism. Our priest will confirm the scheduled date.", Icon: Cross, handleActionFunction: handleEucharistAction },
    { id: 3, title: "Confession", description: "Register for the sacrament of Confession. Our priest will confirm the scheduled date.", Icon: PersonStandingIcon, handleActionFunction: handleConfessionAction },
    { id: 4, title: "Confirmation", description: "Register for the sacrament of Confirmation. Our priest will confirm the scheduled date.", Icon: BookPlusIcon, handleActionFunction: handleConfirmationAction },
    { id: 5, title: "Marriage", description: "Register for the sacrament of Marriage. Our priest will confirm the scheduled date.", Icon: UserRoundPlusIcon, handleActionFunction: handleMarriageAction },
    { id: 6, title: "Anointing of the sick", description: "Register for the sacrament of Anointing of the sick. Our priest will confirm the scheduled date.", Icon: BriefcaseMedicalIcon, handleActionFunction: handleAnointingOfTheSickAction },
    { id: 7, title: "Mass Prayer", description: "Send your prayer written in a image to be prayed by priest during mass", Icon: MapPinPlusInside, handleActionFunction: handleMassPrayerAction },
    { id: 8, title: "Meeting", description: "Book  the meeting request to meet the priest", Icon: User2, handleActionFunction: handleMeetingAction },
  ];

  const getGoToLink = () => {
    if (!applicationType) return null;
    if (applicationType === "baptism") return "/applications/baptism_request/apply";
    if (applicationType === "eucharist") return "/applications/eucharist_request/apply";
    if (applicationType === "confession") return "/applications/confession_request/apply";
    if (applicationType === "marriage") return "/applications/marriage_request/apply";
    if (applicationType === "anointingOfTheSick") return "/applications/anointing_of_the_sick_request/apply";
    if (applicationType === "massPrayer") return "/applications/mass_prayer/apply";
    if (applicationType === "meeting") return "/applications/meeting_request/apply";
  }

  return (
    <div>
      {/* Hero */}
      <HeroSection />

      {/* Priest Availability */}
      <section id="priest" className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-[#C9A84C] uppercase text-xs tracking-[0.3em] font-sans mb-2">Parish Priest</p>
          <h2 className="text-3xl text-[#0F2A4A] font-serif font-semibold">Priest Availability</h2>
          <div className="mt-3 h-[2px] w-16 bg-[#C9A84C] mx-auto rounded-full" />
        </div>
        <PriestAvailabilitySection />
      </section>

      {/* Divider */}
      <Divider />

      {/* Services Placeholder */}
      <section id="services" className="max-w-6xl mx-auto px-6 py-16">
        <SectionTitle
          label="Parish Services"
          title="Our Services"
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {applications.map(application => (<ApplicationCard key={application.id} title={application.title} description={application.description} Icon={application.Icon} handleActionFunction={application.handleActionFunction} />))}
        </div>


      </section>

      <Divider />

      {/* Activities Placeholder */}
      <section id="activities" className="max-w-6xl mx-auto px-6 py-16">
        <SectionTitle
          label="Events & Calendar"
          title="Upcoming Activities"
          description="Upcoming activities section — coming soon"
        />
        <h1 className="text-center text-2xl"> Coming soon </h1>
      </section>

      <Divider />

      {/* Contact Placeholder */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-16">
        <SectionTitle
          label="Get in Touch"
          title="Contact & Schedule a Meeting"
          description="Contact priest / request schedule for meeting form — coming soon"
        />
        <div className="flex justify-center items-center">
          <button
            onClick={() => {
              if(!user) {
                setApplicationType("meeting");
                setLoginSignupModalOpen(true);
                return;
              }
              router.push("/applications/meeting_request/apply")
            }}
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] text-xs font-bold uppercase tracking-[0.8px] px-5 py-2.5 rounded-[7px] transition-colors cursor-pointer border-none font-[inherit]"
          >
            <HandshakeIcon className="w-3.5 h-3.5" />
            Book a Meeting with Priest
          </button>
        </div>

      </section>

      {loginSignupModalOpen && (<LoginSignupModal onSuccess={() => setLoginSignupModalOpen(false)} onCancel={() => setLoginSignupModalOpen(false)} onSuccessGoToLink={getGoToLink()} />)}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 max-w-2xl mx-auto px-6">
      <div className="flex-1 h-px bg-[#0F2A4A]/10" />
      <div className="w-2 h-2 rounded-full bg-[#C9A84C]/50 rotate-45" />
      <div className="flex-1 h-px bg-[#0F2A4A]/10" />
    </div>
  );
}

function SectionTitle({ label, title }) {
  return (
    <div className="text-center">
      <p className="text-[#C9A84C] uppercase text-xs tracking-[0.3em] font-sans mb-2">{label}</p>
      <h2 className="text-3xl text-[#0F2A4A] font-serif font-semibold">{title}</h2>
      <div className="mt-3 h-[2px] w-16 bg-[#C9A84C] mx-auto rounded-full mb-8" />
    </div>);
}

function SectionPlaceholder({ label, title, description, children }) {
  return (
    <div className="text-center">
      <p className="text-[#C9A84C] uppercase text-xs tracking-[0.3em] font-sans mb-2">{label}</p>
      <h2 className="text-3xl text-[#0F2A4A] font-serif font-semibold">{title}</h2>
      <div className="mt-3 h-[2px] w-16 bg-[#C9A84C] mx-auto rounded-full mb-8" />
      <div className="border-2 border-dashed border-[#0F2A4A]/15 rounded-lg py-20 px-10 bg-[#F3EDE3]/50">
        {/* <p className="text-[#0F2A4A]/40 font-sans text-sm italic">{description}</p> */}
        {children}
      </div>
    </div>
  );
}


function ApplicationCard({ Icon, title, description, handleActionFunction }) {
  return (
    <div className="group bg-white rounded-2xl border border-[#0F2A4A]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#C9A84C]/50 transition-all duration-200 overflow-hidden flex flex-col">

      {/* Icon header */}
      <div className="bg-[#0F2A4A] px-6 py-7 flex items-center justify-center relative">
        <Icon className="w-9 h-9 text-[#C9A84C]" strokeWidth={1.4} />
        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest text-[#C9A84C] border border-[#C9A84C]/40 bg-[#C9A84C]/10 rounded-full px-2.5 py-0.5">
          Open
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1">
        <h3 className="text-[#0F2A4A] font-medium text-[15px] mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-5 flex flex-col gap-2">
        <button
          onClick={() => handleActionFunction("apply")}
          className="flex items-center justify-between bg-[#0F2A4A] hover:bg-[#1a3d6b] text-white rounded-lg px-4 py-2.5 transition-colors"
        >
          <span className="text-sm font-medium">Apply now</span>
          <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
        </button>

        <button
          onClick={() => handleActionFunction("viewOrEdit")}
          className="flex items-center justify-center gap-2 border border-[#0F2A4A]/20 hover:border-[#0F2A4A]/40 hover:bg-[#0F2A4A]/5 text-[#0F2A4A] rounded-lg px-4 py-2.5 transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">View my applications</span>
        </button>
      </div>

    </div>
  );
}