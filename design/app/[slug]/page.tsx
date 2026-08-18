import RankBoardApp from "../rankboard-app";

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RankBoardApp route={slug} />;
}
