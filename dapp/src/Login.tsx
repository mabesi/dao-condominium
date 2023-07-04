import React from 'react';

function Login() {
  return (
    <main className="main-content  mt-0">
      <div className="page-header align-items-start min-vh-100" style={{backgroundImage: "url('https://www.kayak.com.br/rimg/himg/4c/24/54/expediav2-126168-fc35dd-698605.jpg')"}} >
        <span className="mask bg-gradient-dark opacity-6"></span>
        <div className="container my-auto">
          <div className="row">
            <div className="col-lg-4 col-md-8 col-12 mx-auto">
              <div className="card z-index-0 fadeIn3 fadeInBottom">
                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                  <div className="bg-gradient-primary shadow-primary border-radius-lg py-3 pe-1">
                    <h4 className="text-white font-weight-bolder text-center mt-2 mb-0">Condominium DAO</h4>
                    
                  </div>
                </div>
                <div className="card-body">
                  <form role="form" className="text-start">
                    <div className="text-center" >
                      <img src="/logo192.png" alt="Condominium logo" />
                    </div>
                    <div className="text-center">
                      <button type="button" className="btn bg-gradient-primary w-100 my-4 mb-2">
                        <img className="me-2" src="/assets/metamask.svg" alt="Metamask logo" width="48" />
                        Sign in with Metamask
                        </button>
                    </div>
                    <p className="mt-4 text-sm text-center">
                      Don't have an account? Ask to the 
                      <a href="mailto:contato@condominio.com" className="text-primary text-gradient font-weight-bold ms-1">manager</a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
