async function register(username, password, email, role, Societies, identityProof, connection) {
    try {
        console.log('Register function received Societies string:', Societies);

        const status = 'pending';

        const societiesArray = Societies.split(',')
            .map(society => society.trim())
            .filter(society => society);

        const uniqueSocieties = [...new Set(societiesArray)];

        const organizationString = uniqueSocieties.join(',');

        console.log('Processed organization string:', organizationString);

        const result = await new Promise((resolve, reject) => {
            connection.query(
                'INSERT INTO user (name, password, email, role, organization, image, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [username, password, email, role, organizationString, identityProof, status],
                (err, rows) => {
                    if (err) {
                        console.error('Database INSERT error:', err);
                        return reject(err);
                    }
                    console.log('Database INSERT successful:', rows);
                    resolve(rows);
                }
            );
        });

        if (result && result.affectedRows > 0) {
            return true;
        } else {
            console.log('Database INSERT did not affect any rows.');
            return false;
        }

    } catch (error) {
        console.error('Error in register function:', error);
        throw error;
    }
}

module.exports = { register };
