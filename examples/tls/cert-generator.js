/*jshint esversion:6, node:true*/
'use strict';

const Generator = require('cert-generator');
//https://github.com/goliatone/cert-generator
let gen = new Generator({
    dir: './poke-certs',
    name: 'poke-server'
});

gen.isRootCAExists()
    .then((exists)=>{
        if(exists){
            return generateClientCerts();
        }

        return gen.generateRootCA()
            .then(()=>{
                console.log('Root CA generated...');
                return generateClientCerts();
            })
            .catch(console.error);
    })
    .catch(console.error);

function generateClientCerts(){
    console.log('Generating client certs...');
    return gen.getCertificate('client.poke.io')
        .then((out) => {
            console.log('cert', out.cert);
            console.log('key', out.key);
        })
        .catch(console.error);
}
