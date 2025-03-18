"use client";
import React from "react";
import { Button } from "antd";
import Link from "next/link";

export default function ButtonStat({
  variant,
  onClick,
  href,
  children,
  ...rest
}) {
  const defaultText =
    variant === "back" ? "Технологические нарушения" : "Посчитать";
  const button = (
    <Button
      type={variant === "back" ? "default" : "primary"}
      onClick={onClick}
      {...rest}
    >
      {children || defaultText}
    </Button>
  );

  if (href) {
    return <Link href={href}>{button}</Link>;
  }
  return button;
}
