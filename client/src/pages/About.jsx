import { useLanguage } from '../context/LanguageContext.jsx';

export default function About() {
  const { t } = useLanguage();
  return (
    <main className="section page-grid">
      <div id="project-objective">
        <p className="eyebrow">{t("About FoodBridge")}</p>
        <h1>{t("A practical platform for food rescue operations")}</h1>
        <p>{t("FoodBridge Network exists to reduce avoidable waste and make community food distribution more predictable. The product gives every role a clear workspace: donors post, partners claim, volunteers deliver, recipients request help, and admins maintain trust.")}</p>
      </div>
      <div className="info-list" id="how-platform-works">
        <h2>{t("Operating principles")}</h2>
        <p id="our-mission"><strong>{t("Safety first")}:</strong> {t("every donation includes timing and handling details.")}</p>
        <p><strong>{t("Accountability")}:</strong> {t("every action is tied to a user and status history.")}</p>
        <p><strong>{t("Dignity")}:</strong> {t("food support workflows avoid unnecessary exposure of recipient data.")}</p>
      </div>
    </main>
  );
}
