import axios from "axios";
import { getClient } from "./elasticsearchClient";
import { fetchFiles, fetchImages, getPagePath, findNodeData } from './helpers';
import { NodeData } from "./types";

async function fetchNews() {
  const drupalSsrUrl = process.env.DRUPAL_SSR_URL;
  if (!drupalSsrUrl) {
    throw "Set DRUPAL_SSR_URL";
  }

  const [fiNewsUrl, svNewsUrl, enNewsUrl] = getPagePath(
    drupalSsrUrl,
    "/node/news",
    "?include=field_page_content",
  );

  const [fi, sv, en, files, media] = await Promise.all([axios.get(fiNewsUrl), axios.get(svNewsUrl), axios.get(enNewsUrl), fetchFiles(drupalSsrUrl), fetchImages(drupalSsrUrl)]);

  const data = fi.data;
  if (!data) {
    throw "Error fetcing drupal news, no data in res";
  }

  const nodeData: NodeData = {
    fi: findNodeData(fi.data, files, media),
    en: findNodeData(en.data, files, media),
    sv: findNodeData(sv.data, files, media),
  };

  return nodeData;
}

export const syncElasticSearchNews = async () => {
  const client = getClient();

  // const newIndex = (name: string) => {
  //   return {
  //     index: name,
  //     body: {
  //       mappings: {
  //         properties: {
  //           id: { type: 'text' },
  //           path: { type: "text" },
  //           date: { type: "date" },
  //           title: { type: "text" },
  //           imageUrl: { type: "text" },
  //           alt: { type: "text" },
  //           summary: { type: "text" },
  //         },
  //       },
  //     },
  //   }
  // };

  try {
    const news = await fetchNews();
    const dataset = Object.keys(news).map((k: any) => {
      return news[k].flatMap((doc: any) => [{ index: { _index: "news-" + k, _id : doc.id } }, doc]);
    });
  
    const body = dataset.flatMap((doc: any) => doc);
    await client.bulk({ refresh: true, body });
    const [{ count: fiCount }, { count: svCount }, { count: enCount }] = await Promise.all([client.count({ index: "news-fi" }), client.count({ index: "news-sv" }), client.count({ index: "news-en" })]);
    console.log("news-fi added:", fiCount);
    console.log("news-sv added:", svCount);
    console.log("news-en added:", enCount);
  } catch (err) {
    console.warn("WARNING when adding news to index: " + err);
  }

};
