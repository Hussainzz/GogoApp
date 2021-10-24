import React from 'react'
import ClipLoader from "react-spinners/ClipLoader";

const Spinner = ({loading,}) => {
    return  (
        <div className="mt-3 text-center">
            <ClipLoader color={'black'} loading={loading} size={25} />
        </div>
    )
}

export default Spinner
