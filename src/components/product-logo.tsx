import Link from "next/link";

type ProductLogoProps = {
  onClick?: () => void;
};

export default function ProductLogo({ onClick }: ProductLogoProps) {
  return (
    <Link className="p-brand" href="/" aria-label="RankBoard home" onClick={onClick}>
      <span className="p-brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>RANKBOARD</span>
      <small>{"// LIVE"}</small>
    </Link>
  );
}
