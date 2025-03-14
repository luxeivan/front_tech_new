"use client";

import React from "react";
import { Button} from "antd";
import Link from "next/link";

export default function ButtonStatBack() {
  return (
    <Link href="/">
      <Button type="default">Технологические нарушения</Button>
    </Link>
  );
}
