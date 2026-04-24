interface ImageCardProps {
  url: string;
}

export function ImageCard({ url }: ImageCardProps) {
  return (
    <div className="my-2">
      <img
        src={url}
        alt="generated"
        className="max-w-full rounded-lg"
      />
    </div>
  );
}
