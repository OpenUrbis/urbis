import axios from "axios";

export const fetchAttributes = async (url: string, layerName: string): Promise<string[]> => {
  if (!url || !layerName) return [];

  try {
    const getBaseUrl = (inputUrl: string) => {
      try {
        const urlObj = new URL(inputUrl);
        return `${urlObj.origin}${urlObj.pathname}`;
      } catch {
        return inputUrl;
      }
    };

    const baseUrl = getBaseUrl(url);
    const environment =
      import.meta.env.VITE_API_URL || "/api";

    // Try WFS 2.0.0 first, usually gives clean XSD
    const response = await axios.get(`${environment}/maps/proxy`, {
      params: {
        url: `${baseUrl}?service=WFS&version=2.0.0&request=DescribeFeatureType&typeName=${layerName}`,
      },
    });

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");

    const foundAttributes: string[] = [];

    // Search strategies for XSD
    const sequences = xmlDoc.getElementsByTagNameNS("*", "sequence");
    if (sequences.length > 0) {
      const seqElements = sequences[0].children;
      for (let i = 0; i < seqElements.length; i++) {
        // Check if it is an element
        if (seqElements[i].localName === "element") {
          const name = seqElements[i].getAttribute("name");
          if (name) foundAttributes.push(name);
        }
      }
    }

    if (foundAttributes.length === 0) {
      // Fallback: search all elements
      const elements = xmlDoc.getElementsByTagNameNS("*", "element");
      for (let i = 0; i < elements.length; i++) {
        const name = elements[i].getAttribute("name");
        if (name && name !== layerName) {
          foundAttributes.push(name);
        }
      }
    }

    return Array.from(new Set(foundAttributes));
  } catch (e) {
    console.error("Failed to fetch attributes", e);
    return [];
  }
};
