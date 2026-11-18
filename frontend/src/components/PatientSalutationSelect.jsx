import AddableSelect from './AddableSelect'

export default function PatientSalutationSelect({
  options = [],
  value = '',
  onChange,
  className = 'field-control',
  disabled = false,
  skipAddOnTab = false,
}) {
  return (
    <AddableSelect
      field="patient_salutation"
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      disabled={disabled}
      skipAddOnTab={skipAddOnTab}
    />
  )
}
