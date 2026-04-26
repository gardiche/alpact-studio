import { Zap } from "lucide-react";

export default function AstrydPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#ff8f2718" }}
        >
          <Zap size={40} style={{ color: "#ff8f27" }} />
        </div>

        <h1 className="font-serif text-4xl mb-3" style={{ color: "#ff8f27" }}>
          Astryd
        </h1>

        <p className="font-sans text-base text-fg mb-2">
          En cours de configuration.
        </p>

        <p className="font-sans text-sm text-muted leading-relaxed">
          Clarté personnelle et décisionnelle — bientôt disponible dans votre suite.
        </p>
      </div>
    </div>
  );
}
