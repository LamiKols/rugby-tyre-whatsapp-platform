import {
  Car,
  CheckCircle2,
  CircleDot,
  Clock,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Wrench
} from "lucide-react";

const businessName = import.meta.env.VITE_PUBLIC_BUSINESS_NAME || "Rugby Tyre Services";
const businessLocation = import.meta.env.VITE_PUBLIC_BUSINESS_LOCATION || "Rugby, England";
const whatsappUrl = import.meta.env.VITE_PUBLIC_WHATSAPP_URL || "";
const phoneNumber = import.meta.env.VITE_PUBLIC_PHONE_NUMBER || "";
const phoneHref = phoneNumber ? `tel:${phoneNumber.replace(/[^+\d]/g, "")}` : "";

const trustMarkers = [
  "4.9-star local tyre service",
  "Mobile callouts",
  "In-shop tyre fitting",
  "Emergency support"
];

const services = [
  {
    title: "Mobile tyre callout",
    description: "Request help at home, work or roadside across Rugby and nearby areas.",
    icon: Car
  },
  {
    title: "In-shop tyre fitting",
    description: "Visit the shop for practical tyre fitting support and price confirmation.",
    icon: Wrench
  },
  {
    title: "Puncture repair",
    description: "Send details on WhatsApp and the team will confirm whether repair is possible.",
    icon: LifeBuoy
  },
  {
    title: "Tyre replacement",
    description: "Share your tyre size to check suitable replacement options and fitted prices.",
    icon: CircleDot
  },
  {
    title: "Wheel balancing",
    description: "Ask the shop about balancing support when fitting or replacing tyres.",
    icon: CheckCircle2
  },
  {
    title: "Emergency support",
    description: "Message or call for urgent tyre problems and the shop will confirm availability.",
    icon: ShieldCheck
  }
];

const serviceAreas = [
  "Rugby",
  "Hillmorton",
  "Bilton",
  "Brownsover",
  "Dunchurch",
  "Clifton upon Dunsmore",
  "Surrounding Warwickshire areas"
];

const faqs = [
  {
    question: "Do you offer mobile tyre fitting?",
    answer: "Customers can request mobile or emergency tyre help through WhatsApp or phone, and the shop will confirm availability."
  },
  {
    question: "Can I send my tyre size by WhatsApp?",
    answer: "Yes. Send a tyre size such as 205/55/R16, or send a photo of the tyre wall if you are unsure."
  },
  {
    question: "Do you do emergency callouts?",
    answer: "Emergency and mobile support can be requested by WhatsApp or phone, then Rugby Tyre Services will confirm what is available."
  },
  {
    question: "Can I pay by card or bank transfer?",
    answer: "Payment options can be confirmed by the shop. Automated payment links are not promised on this public page yet."
  },
  {
    question: "What if I do not know my tyre size?",
    answer: "You can send a photo of the tyre wall on WhatsApp or ask the shop to help you find the right size."
  }
];

function WhatsAppCta({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const className = dark
    ? "inline-flex min-h-12 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-bold text-charcoal shadow-sm transition hover:bg-slate-100"
    : "inline-flex min-h-12 items-center justify-center rounded-md bg-whatsapp-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-whatsapp-600";

  return (
    <a className={className} href={whatsappUrl || "#contact"} aria-label="Message Rugby Tyre Services on WhatsApp">
      <MessageCircle className="mr-2 h-5 w-5" />
      {children}
    </a>
  );
}

function CallCta({ dark = false }: { dark?: boolean }) {
  const className = dark
    ? "inline-flex min-h-12 items-center justify-center rounded-md border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
    : "inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-charcoal transition hover:border-whatsapp-500";

  if (!phoneHref) {
    return (
      <span className={`${className} cursor-not-allowed opacity-60`} aria-disabled="true">
        <Phone className="mr-2 h-5 w-5" />
        Call now
      </span>
    );
  }

  return (
    <a className={className} href={phoneHref} aria-label="Call Rugby Tyre Services now">
      <Phone className="mr-2 h-5 w-5" />
      Call now
    </a>
  );
}

export function PublicLandingPage() {
  return (
    <main className="bg-slate-50 text-charcoal">
      <section className="relative overflow-hidden bg-charcoal text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.22),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0)_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/15 px-3 py-1 text-sm font-semibold text-whatsapp-100">
              WhatsApp-first tyre help in {businessLocation}
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              24hr Mobile Tyre Service in Rugby
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Fast tyre replacement, puncture help and emergency callouts across Rugby and surrounding areas.
            </p>
            <div id="contact" className="mt-8 flex flex-col gap-3 sm:flex-row">
              <WhatsAppCta>Message us on WhatsApp</WhatsAppCta>
              <CallCta dark />
            </div>
            {!whatsappUrl || !phoneHref ? (
              <p className="mt-3 text-sm text-slate-300">
                Public WhatsApp and phone details still need final owner confirmation.
              </p>
            ) : null}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trustMarkers.map((marker) => (
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold" key={marker}>
                  <CheckCircle2 className="h-4 w-4 text-whatsapp-500" />
                  {marker}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-lg bg-white p-5 text-charcoal">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Local tyre support</p>
                  <p className="text-2xl font-black">{businessName}</p>
                </div>
                <CircleDot className="h-10 w-10 text-whatsapp-600" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Send tyre size</p>
                  <p className="mt-1 text-3xl font-black">205/55/R16</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                  <div className="rounded-md bg-amber-50 p-4 text-amber-800">Mobile callouts</div>
                  <div className="rounded-md bg-whatsapp-50 p-4 text-whatsapp-700">Shop fitting</div>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-slate-200 p-4">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <p className="text-sm text-slate-600">Urgent tyre problems can be requested by WhatsApp or phone.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black">Tyre services for local drivers</h2>
          <p className="mt-3 text-slate-600">Practical support for everyday tyre problems, urgent punctures and replacement tyres.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article className="panel p-5" key={service.title}>
                <div className="mb-4 inline-flex rounded-md bg-whatsapp-50 p-3 text-whatsapp-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {["Message us", "Send tyre size or location", "Get confirmation", "We fit or repair"].map((step, index) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5" key={step}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-whatsapp-600 text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-bold">{step}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {index === 0 && "Start with WhatsApp so the shop has the details in one place."}
                  {index === 1 && "Send your tyre size, a tyre-wall photo or your location for mobile help."}
                  {index === 2 && "The shop confirms availability, price and the next practical step."}
                  {index === 3 && "Rugby Tyre Services supports you in-shop or by mobile callout."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="panel p-6">
          <h2 className="text-3xl font-black">Find your tyre size</h2>
          <p className="mt-3 text-slate-600">
            Your tyre size is usually printed on the side wall of the tyre. It looks like this:
          </p>
          <div className="my-6 rounded-lg bg-charcoal p-6 text-center text-4xl font-black text-white">205/55/R16</div>
          <p className="text-sm leading-6 text-slate-600">
            If you are not sure, send a photo of the tyre wall on WhatsApp and ask the shop to check it for you.
          </p>
          <div className="mt-6">
            <WhatsAppCta>Send your tyre size on WhatsApp</WhatsAppCta>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-soft">
          <div className="inline-flex rounded-md bg-white p-3 text-amber-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-3xl font-black">Emergency mobile callouts</h2>
          <p className="mt-3 leading-7 text-amber-950">
            For urgent tyre problems, message or call Rugby Tyre Services and share your location through WhatsApp so the shop can confirm the next available help.
          </p>
          <p className="mt-4 rounded-md bg-white p-4 text-sm font-semibold leading-6 text-amber-950">
            If you are stopped in a dangerous location, stay away from the vehicle and follow roadside safety guidance before messaging or calling.
          </p>
        </div>
      </section>

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black">Trusted by local drivers in Rugby</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "4.9-star local tyre service",
              "Fast support for tyre problems, punctures and mobile callouts",
              "Local shop support for Rugby and nearby Warwickshire areas"
            ].map((item) => (
              <div className="rounded-lg border border-white/10 bg-white/5 p-5" key={item}>
                <Star className="mb-4 h-6 w-6 fill-amber-400 text-amber-400" />
                <p className="font-semibold leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <MapPin className="mb-4 h-8 w-8 text-whatsapp-600" />
            <h2 className="text-3xl font-black">Local service area</h2>
            <p className="mt-3 text-slate-600">
              Serving drivers in Rugby and surrounding Warwickshire areas. Message the shop to confirm mobile availability for your location.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceAreas.map((area) => (
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 font-semibold shadow-sm" key={area}>
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details className="rounded-lg border border-slate-200 bg-slate-50 p-5" key={faq.question}>
                <summary className="cursor-pointer text-base font-bold">{faq.question}</summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-lg font-black">{businessName}</p>
            <p className="mt-1 text-sm text-slate-300">{businessLocation}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <WhatsAppCta dark>Message us on WhatsApp</WhatsAppCta>
            <CallCta dark />
          </div>
          <a className="text-sm text-slate-400 transition hover:text-white" href="/admin">
            Staff login
          </a>
        </div>
      </footer>
    </main>
  );
}

