import {
  Combobox as MCombobox,
  Input,
  InputBase,
  useCombobox,
} from "@mantine/core";
import React from "react";
import type { ReactElement } from "react";

type Props = {
  className: string;
  options: { value: string; label: ReactElement }[];
  value: string | null;
  onSelect: (value: string) => void;
};

export function Combobox({ className, options, value, onSelect }: Props) {
  const optionMap: { [value: string]: ReactElement } = options.reduce(
    (object, option) => ({ ...object, [option.value]: option.label }),
    {},
  );

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  return (
    <div className={className}>
      <MCombobox
        store={combobox}
        withinPortal={false}
        onOptionSubmit={(val) => {
          onSelect(val);
          combobox.closeDropdown();
        }}
      >
        <MCombobox.Target>
          <InputBase
            component="button"
            type="button"
            pointer
            rightSection={<MCombobox.Chevron />}
            onClick={() => combobox.toggleDropdown()}
            rightSectionPointerEvents="none"
          >
            {(value && optionMap[value]) || (
              <Input.Placeholder>Linie ausw&auml;hlen</Input.Placeholder>
            )}
          </InputBase>
        </MCombobox.Target>

        <MCombobox.Dropdown>
          <MCombobox.Options mah={200} style={{ overflowY: "auto" }}>
            {options.map((option) => (
              <MCombobox.Option key={option.value} value={option.value}>
                {option.label}
              </MCombobox.Option>
            ))}
          </MCombobox.Options>
        </MCombobox.Dropdown>
      </MCombobox>
    </div>
  );
}
