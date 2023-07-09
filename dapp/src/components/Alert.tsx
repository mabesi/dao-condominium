//import React from 'react';

type Props = {
    title: string;
    text: string;
    materialIcon: string;
    alertClass: string;
}

/**
 * props 
 * - title
 * - text
 * - materialIcon
 * - alertClass
 */
function Alert(props : Props) {

    return (
        <div className={"alert alert-success alert-dismissible text-white mx-3 " + props.alertClass} role="alert">
            {
                props.materialIcon
                ? (
                    <span className="alert-icon align-middle me-2" >
                        <span className="material-icons text-md">
                            {props.materialIcon}
                        </span>
                    </span>
                )
                : <></>
            }
            <span className="alert-text">
                <strong>{props.title}</strong> {props.text}
            </span>
            <button type="button" className="btn-close text-lg py-3 opacity-10" data-bs-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    )
}

export default Alert;