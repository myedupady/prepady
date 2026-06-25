'use client'

import * as React from 'react'
import { useField } from '@payloadcms/ui'

/**
 * Custom admin field: a native colour picker synced with a hex text input.
 * Stores a plain hex string, so the field stays a normal `text` field at the
 * data layer (and the value is valid even if the picker UI ever changes).
 * Wired via `admin.components.Field` on the Theme global + Region colours.
 */
type Props = {
  path: string
  field?: { label?: string; admin?: { description?: string } }
}

export const ColorField: React.FC<Props> = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })
  const current = typeof value === 'string' ? value : ''
  const swatch = /^#[0-9a-fA-F]{6}$/.test(current) ? current : '#000000'

  return (
    <div className="field-type text" style={{ marginBottom: '1.5rem' }}>
      {field?.label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{field.label}</label>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="color"
          value={swatch}
          onChange={(e) => setValue(e.target.value)}
          aria-label={field?.label ?? 'Colour'}
          style={{
            width: 46, height: 40, padding: 0, cursor: 'pointer',
            border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: 'transparent',
          }}
        />
        <input
          type="text"
          value={current}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#RRGGBB"
          spellCheck={false}
          style={{
            maxWidth: 170, height: 40, padding: '0 10px', color: 'inherit',
            border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: 'var(--theme-input-bg, transparent)',
          }}
        />
      </div>
      {field?.admin?.description && (
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--theme-elevation-500)' }}>
          {field.admin.description}
        </div>
      )}
    </div>
  )
}

export default ColorField
