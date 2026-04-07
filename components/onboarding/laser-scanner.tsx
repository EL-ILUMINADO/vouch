export const LaserScanner = ({ isScanning }: { isScanning: boolean }) => {
  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-3xl">
      {/* The Moving Laser Line */}
      <div className="absolute w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_2px_rgba(99,102,241,0.8)] animate-laser-move" />

      {/* The Soft Glow Overlay */}
      <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
    </div>
  );
};
