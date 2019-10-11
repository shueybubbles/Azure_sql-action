import * as core from '@actions/core';
import SqlConnectionStringBuilder from "../src/SqlConnectionStringBuilder";

jest.mock('@actions/core');

describe('SqlConnectionStringBuilder tests', () => {

    describe('validate correct connection strings', () => {
        let validConnectionStrings = [
            [`User Id=user;Password="ab'=abcdf''c;123";Initial catalog=testdb`, 'validates values enclosed with double quotes ', `ab'=abcdf''c;123`],
            [`User Id=user;Password='abc;1""2"adf=33';Initial catalog=testdb`, 'validates values enclosed with single quotes ', `abc;1""2"adf=33`],
            [`User Id=user;Password="abc;1""2""adf(012j^72''asj;')'=33";Initial catalog=testdb`, 'validates values beginning with double quotes and also contains escaped double quotes', `abc;1"2"adf(012j^72''asj;')'=33`],
            [`User Id=user;Password='ab""c;1''2''"''adf("0""12j^72''asj;'')''=33';Initial catalog=testdb`, 'validates values beginning with single quotes and also contains escaped single quotes', `ab""c;1'2'"'adf("0""12j^72'asj;')'=33`],
            [`User Id=user;Password=JustANormal123@#$password;Initial catalog=testdb`, 'validates values not beginning quotes and not containing quotes or semi-colon', `JustANormal123@#$password`]
        ];
    
        it.each(validConnectionStrings)('Input `%s` %s', (connectionStringInput, testDescription, passwordOutput) => {
            let connectionString = new SqlConnectionStringBuilder(connectionStringInput);
    
            expect(connectionString.connectionString).toMatch(connectionStringInput);
            expect(connectionString.password).toMatch(passwordOutput);
            expect(connectionString.userId).toMatch(`user`);
            expect(connectionString.database).toMatch('testdb');
        });
    })

    describe('throw for invalid connection strings', () => {
        let invalidConnectionStrings = [
            [`User Id=user;Password="ab'=abcdf''c;123;Initial catalog=testdb`, 'validates values beginning with double quotes but not ending with double quotes'],
            [`User Id=user;Password='abc;1""2"adf=33;Initial catalog=testdb`, 'validates values beginning with single quote but not ending with single quote'],
            [`User Id=user;Password="abc;1""2"adf(012j^72''asj;')'=33";Initial catalog=testdb`, 'validates values enclosed in double quotes but does not escape double quotes in between'],
            [`User Id=user;Password='ab""c;1'2''"''adf("0""12j^72''asj;'')''=33';Initial catalog=testdb`, 'validates values enclosed in single quotes but does not escape single quotes in between'],
            [`User Id=user;Password=NotANormal123@;#$password;Initial catalog=testdb`, 'validates values not enclosed in quotes and containing semi-colon']
        ];

        it.each(invalidConnectionStrings)('Input `%s` %s', (connectionString) => {
            expect(() => new SqlConnectionStringBuilder(connectionString)).toThrow();
        })
    })

    it('should mask connection string password', () => {
        let setSecretSpy = jest.spyOn(core, 'setSecret');
        new SqlConnectionStringBuilder('User Id=user;Password=1234;Initial Catalog=testDB');

        expect(setSecretSpy).toHaveBeenCalled();
    });
})