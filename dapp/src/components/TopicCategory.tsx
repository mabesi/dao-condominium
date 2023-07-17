type Props = {
    value: number | string;
    onChange: Function;
    disabled?: boolean;
}

/**
 * props:
 *  - value
 *  - onChange
 *  - disabled
 */
function TopicCategory(props: Props) {

    function onCategoryChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        if (!evt.target.value) return;
        props.onChange({ target: { id: "category", value: evt.target.value } });
    }

    return (
        <select id="category" className="form-select px-3" value={props.value} onChange={onCategoryChange} disabled={props.disabled} >
            <option value="">Select</option>
            <option value="0">Decision</option>
            <option value="1">Spent</option>
            <option value="2">Change Quota</option>
            <option value="3">Change Manager</option>
        </select>
    )
}

export default TopicCategory