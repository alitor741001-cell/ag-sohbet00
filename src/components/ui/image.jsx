import * as React from "react"

const Image = React.forwardRef(({ src, alt, className, fittingType = "fill", originWidth, originHeight, focalPointX, focalPointY, ...props }, ref) => {
  if (!src) return null

  const isBase44Media = typeof src === "string" && (src.includes("media.base44.com") || src.includes("static.wixstatic.com"))
  const isSvg = typeof src === "string" && src.endsWith(".svg")

  if (isSvg || !isBase44Media) {
    return <img ref={ref} src={src} alt={alt} className={className} {...props} />
  }

  const objectFit = fittingType === "fit" ? "contain" : "cover"
  const focalStyle = focalPointX != null && focalPointY != null
    ? { objectPosition: `${focalPointX * 100}% ${focalPointY * 100}%` }
    : {}

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={{ objectFit, ...focalStyle }}
      loading="lazy"
      {...props}
    />
  )
})
Image.displayName = "Image"

export { Image }