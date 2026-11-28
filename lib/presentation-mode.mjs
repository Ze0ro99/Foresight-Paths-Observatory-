/**
 * Keep synthetic scenario data out of the consumer map.
 * Only Pro Mode may render the seeded scenario/forecast workspace.
 *
 * @template EventItem, ForecastItem, ArcItem
 * @param {'simple'|'pro'|string} mode
 * @param {{events?: EventItem[], forecasts?: ForecastItem[], geodesicArcs?: ArcItem[]}} data
 * @returns {{events: EventItem[], forecasts: ForecastItem[], geodesicArcs: ArcItem[]}}
 */
export function getMapPresentation(mode, data = {}) {
  if (mode !== 'pro') {
    return { events: [], forecasts: [], geodesicArcs: [] };
  }

  return {
    events: Array.isArray(data.events) ? data.events : [],
    forecasts: Array.isArray(data.forecasts) ? data.forecasts : [],
    geodesicArcs: Array.isArray(data.geodesicArcs) ? data.geodesicArcs : [],
  };
}
