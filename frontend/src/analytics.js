const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function startAnalytics() {
  if (!measurementId || document.querySelector("#google-analytics-tag")) return;

  const script = document.createElement("script");
  script.id = "google-analytics-tag";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
}

export function trackPageView(path) {
  if (measurementId && window.gtag) {
    // Do not send query strings; password reset links contain a private token there.
    window.gtag("event", "page_view", { page_path: path, page_location: `${window.location.origin}${path}` });
  }
}

export function trackEvent(eventName, details = {}) {
  if (measurementId && window.gtag) window.gtag("event", eventName, details);
}
