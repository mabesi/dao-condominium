function Footer() {

    return (
        <footer className="footer py-4  ">
            <div className="container-fluid">
                <div className="row align-items-center justify-content-lg-between">
                    <div className="col-lg-6 mb-lg-0 mb-4">
                        <div className="copyright text-center text-sm text-muted text-lg-start">
                            Built by Mabesi © 2023
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <ul className="nav nav-footer justify-content-center justify-content-lg-end">
                            <li className="nav-item">
                                <a href="https://www.meusite.com" className="nav-link text-muted" target="_blank">Meu Site</a>
                            </li>
                            <li className="nav-item">
                                <a href="https://www.meufacebook.com" className="nav-link text-muted" target="_blank">Facebook</a>
                            </li>
                            <li className="nav-item">
                                <a href="https://www.meutwitter.com" className="nav-link text-muted" target="_blank">Twitter</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;