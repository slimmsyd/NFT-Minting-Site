// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  // get the tokenId from the query params
  const tokenId = req.query.tokenId;
  const image_url =
    "ipfs://bafkreiamnyb6fgp2gdsailpjel6yyazgkukefnijiffuov2bglh2ela46y/";
  // The api is sending back metadata 
  // To make our collection compatible with Opensea, we need to follow some Metadata standards
  // when sending back the response from the api
  // More info can be found here: https://docs.opensea.io/docs/metadata-standards
  res.status(200).json({
    name: "Family NFT #" + tokenId,
    description: "Part Of The Family",
    image: image_url + tokenId + ".jpg",
  });
}