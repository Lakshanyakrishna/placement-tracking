import { useState } from 'react'
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps<T extends FieldValues> {
  id: string
  label: string
  register: UseFormRegister<T>
  fieldName: Path<T>
  error?: string
}

export function PasswordField<T extends FieldValues>({ id, label, register, fieldName, error }: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm text-[#111827]">{label}</Label>
      <div className="relative">
        <Input id={id} type={visible ? 'text' : 'password'} className="pr-10" {...register(fieldName)} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide typed characters' : 'Show typed characters'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
