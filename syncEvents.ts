import { getClient } from "./elasticsearchClient";
import { deleteIndex, createIndex, getDrupalEvents, allowedTags, capitalize } from "./helpers";

async function fetchDrupalEvents() {
  const drupalSsrUrl = process.env.DRUPAL_SSR_URL;
  if (!drupalSsrUrl) {
    throw "Set DRUPAL_SSR_URL";
  }
  const eventsdrupalSsrUrl = drupalSsrUrl + '/jsonapi/node/event';
  const drupalEvents = await getDrupalEvents(eventsdrupalSsrUrl);

  if (!drupalEvents) {
    throw "Error fetching drupal events, no event data in res";
  }

  const parsedEvents = drupalEvents.reduce((acc: any, curr: any) => {
    const attr = curr.attributes;
    let tags = attr.field_tags.sort((a: string, b: string) => allowedTags.indexOf(a) - allowedTags.indexOf(b));
    tags = tags.map((tag: string) => tag === 'maahanmuuttajat' ? 'Maahan muuttaneet' : capitalize(tag));

    const event = {
      id: attr.field_id,
      path: attr.path.alias,
      title: attr.field_title,
      image: attr.field_image_url,
      alt: attr.field_image_alt,
      text: attr.field_text?.value,
      startTime: attr.field_start_time,
      endTime: attr.field_end_time,
      location: attr.field_location,
      locationExtraInfo: attr.field_location_extra_info,
      tags
    };
    return [...acc, event];
  }, []);

  return parsedEvents;
}

export const syncElasticSearchEvents = async () => {
  const client = getClient();

  const properties = {
    id: { type: "text" },
    path: { type: "text" },
    title: { type: "text" },
    image: { type: "text" },
    alt: { type: "text" },
    text: { type: "text" },
    startTime: { type: "date" },
    endTime: { type: "date" },
    location: { type: "text" },
    locationExtraInfo: { type: "text" },
    tags: { type: "text" },
  };

  await deleteIndex('events');
  await createIndex('events', properties);

  try {
    let dataset = await fetchDrupalEvents();
    const operations = dataset.flatMap((doc: any) => [{ index: { _index: "events", _id : doc.id } }, doc]);
    await client.bulk({ refresh: true, operations });
    const { count } = await client.count({ index: "events" });
    console.log("added:", count);
  } catch (err) {
    console.log("ERROR when adding events to index: ", err);
  }

};
