export const fetchData = async (category: string) => {
  const key = `wJN42eNUnoO8qshic71phajCgmk1eAsQ`;
  try {
    const response = await fetch(
      `https://api.nytimes.com/svc/topstories/v2/${category}.json?api-key=${key}`,
      { cache: "force-cache", next: { revalidate: 6000 } }
    );
    const data = await response.json();
    return data.results;
    // console.log(data.results[0].media[0]["media-metadata"][0].url);
    console.log(response);
  } catch (error) {
    console.log("error fetching data:", error);
  }
};
