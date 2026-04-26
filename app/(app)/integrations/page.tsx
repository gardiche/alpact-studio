import { Badge } from "@/components/ui/Badge";

const integrations = [
  {
    provider: "pennylane",
    name: "Pennylane",
    description: "Synchronisez vos données financières — MRR, cash, transactions vers Elyse.",
    available: true,
    logo: "/Pennylane.png",
  },
  {
    provider: "qonto",
    name: "Qonto",
    description: "Connectez votre trésorerie et vos mouvements bancaires vers Elyse.",
    available: true,
    logo: "/Qonto.png",
  },
  {
    provider: "google",
    name: "Google Workspace",
    description: "Drive, Gmail et Calendar — contexte opérationnel pour vos outils.",
    available: true,
    logo: "/Google.png",
  },
  {
    provider: "notion",
    name: "Notion",
    description: "Base opérationnelle — données stratégiques pour Astryd.",
    available: true,
    logo: "/Notion.png",
  },
  {
    provider: "stripe",
    name: "Stripe",
    description: "MRR, revenus et abonnements — alimentez le pulse du hub.",
    available: true,
    logo: "/Stripe.png",
  },
  {
    provider: "hubspot",
    name: "HubSpot",
    description: "CRM — données commerciales et pipeline pour Gyna.",
    available: false,
    logo: "/Hubspot.png",
  },
  {
    provider: "slack",
    name: "Slack",
    description: "Notifications équipe — fil d'activité du hub.",
    available: false,
    logo: "/Slack.png",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-fg mb-2">Intégrations</h1>
          <p className="font-sans text-sm text-muted">
            Connectez vos outils pour alimenter votre suite Alpact Studio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.provider}
              className="bg-surface rounded-card shadow-card p-6"
            >
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border-2 border-black">
                  <img src={integration.logo} alt={integration.name} className={`object-contain ${integration.provider === 'google' ? 'w-14 h-14' : ['pennylane', 'qonto', 'hubspot'].includes(integration.provider) ? 'w-9 h-9' : 'w-7 h-7'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-sans font-semibold text-sm text-fg">
                      {integration.name}
                    </h3>
                    {integration.available && (
                      <Badge variant="muted">Non connecté</Badge>
                    )}
                  </div>
                  <p className="font-sans text-xs text-muted leading-relaxed mb-4">
                    {integration.description}
                  </p>

                  <button
                    className="px-3 py-1.5 rounded-full font-sans font-medium text-sm text-white"
                    style={{ background: '#111', opacity: integration.available ? 1 : 0.5 }}
                  >
                    {integration.available ? "Connecter" : "Bientôt disponible"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs font-sans text-muted text-center mt-6">
          Les connexions OAuth seront activées dans le chantier 5.
        </p>
      </div>
    </div>
  );
}
