import React, { useState } from 'react';
import { ColorPickerPanel } from 'tdesign-react';

export default function EnableAlpha() {
  const [value, setValue] = useState('#0052d9');

  const handleChange = (value) => {
    setValue(value);
  };

  return (
    <div className="tdesign-demo-block-row">
      <ColorPickerPanel value={value} format="RGBA" enableAlpha onChange={handleChange} />
    </div>
  );
}
